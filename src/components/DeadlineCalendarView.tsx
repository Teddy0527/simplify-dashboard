import { useState, useMemo, useCallback, useEffect, useRef, forwardRef } from 'react';
import { Company, CompanyDeadline, DEADLINE_TYPE_LABELS } from '@jobsimplify/shared';
import type { DeadlineType } from '@jobsimplify/shared';
import { getDeadlineUrgency, getDeadlineTypeColor, DEADLINE_TYPE_COLORS, formatTimeJP } from '../utils/deadlineHelpers';
import { useGoogleCalendar, useGoogleCalendarEventMap } from '../hooks/useGoogleCalendar';
import type { CalendarEventDisplay } from '../types/googleCalendar';

interface DeadlineCalendarViewProps {
  companies: Company[];
  onCardClick: (company: Company) => void;
}

interface DeadlineWithCompany extends CompanyDeadline {
  company: Company;
}

type CalendarSubView = 'month' | 'week';

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

const MAX_ITEMS_PER_CELL = 3;


export default function DeadlineCalendarView({ companies, onCardClick }: DeadlineCalendarViewProps) {
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(0);

  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [subView, setSubView] = useState<CalendarSubView>('month');
  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - day);
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  });

  // Popover state
  const [popover, setPopover] = useState<{
    dateStr: string;
    deadlines: DeadlineWithCompany[];
    gcalEvents: CalendarEventDisplay[];
    rect: DOMRect;
  } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { events: gcalEvents, loading: gcalLoading, enabled: gcalEnabled, setEnabled: setGcalEnabled, tokenAvailable, reconnect } = useGoogleCalendar(year, month);
  const gcalEventMap = useGoogleCalendarEventMap(gcalEvents);

  // Build deadline map
  const deadlineMap = useMemo(() => {
    const map = new Map<string, DeadlineWithCompany[]>();
    for (const company of companies) {
      for (const d of company.deadlines ?? []) {
        const list = map.get(d.date) || [];
        list.push({ ...d, company });
        map.set(d.date, list);
      }
    }
    return map;
  }, [companies]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Build calendar grid (with prev/next month days)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const days: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

    // Previous month fill
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      days.push({
        day: d,
        isCurrentMonth: false,
        dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        day: d,
        isCurrentMonth: true,
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }
    // Next month fill
    while (days.length % 7 !== 0) {
      const d = days.length - firstDay - daysInMonth + 1;
      const m = month + 2 > 12 ? 1 : month + 2;
      const y = month + 2 > 12 ? year + 1 : year;
      days.push({
        day: d,
        isCurrentMonth: false,
        dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }
    return days;
  }, [year, month]);

  const numRows = calendarDays.length / 7;

  // ResizeObserver でグリッドコンテナの利用可能スペースを測定し cellSize を算出
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      // 曜日ヘッダー分(約32px)を差し引いてグリッド行に使える高さを算出
      const availableHeight = height - 32;
      const size = Math.floor(Math.min(width / 7, availableHeight / numRows));
      setCellSize(Math.max(size, 0));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [numRows]);

  // Week days
  const weekDays = useMemo(() => {
    const days: { day: number; month: number; year: number; dateStr: string; dayOfWeek: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push({
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        dayOfWeek: d.getDay(),
      });
    }
    return days;
  }, [weekStart]);

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }
  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  }
  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  }
  function goToday() {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const day = now.getDay();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - day);
    sunday.setHours(0, 0, 0, 0);
    setWeekStart(sunday);
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') {
        subView === 'month' ? prevMonth() : prevWeek();
      } else if (e.key === 'ArrowRight') {
        subView === 'month' ? nextMonth() : nextWeek();
      } else if (e.key === 't' || e.key === 'T') {
        goToday();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [subView, year, month, weekStart]);

  // Close popover on outside click
  useEffect(() => {
    if (!popover) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [popover]);

  const handleOverflowClick = useCallback((
    e: React.MouseEvent,
    dateStr: string,
    deadlines: DeadlineWithCompany[],
    gcalEntries: CalendarEventDisplay[],
  ) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopover({ dateStr, deadlines, gcalEvents: gcalEntries, rect });
  }, []);

  // Week header title
  const weekTitle = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const sm = weekStart.getMonth() + 1;
    const sd = weekStart.getDate();
    const em = end.getMonth() + 1;
    const ed = end.getDate();
    if (sm === em) {
      return `${sm}月${sd}日 - ${ed}日`;
    }
    return `${sm}月${sd}日 - ${em}月${ed}日`;
  }, [weekStart]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col px-4 pb-2">
      {/* Header - Google Calendar style */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-1">
          {/* Today button */}
          <button
            onClick={goToday}
            className="text-sm font-medium px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 mr-2"
          >
            今日
          </button>
          {/* Prev */}
          <button
            onClick={subView === 'month' ? prevMonth : prevWeek}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {/* Next */}
          <button
            onClick={subView === 'month' ? nextMonth : nextWeek}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {/* Title */}
          <h2 className="text-xl font-semibold text-gray-900 ml-3">
            {subView === 'month' ? `${year}年${month + 1}月` : weekTitle}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Month/Week toggle */}
          <div className="flex bg-gray-100 rounded-md p-0.5">
            <button
              onClick={() => setSubView('month')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                subView === 'month' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              月
            </button>
            <button
              onClick={() => setSubView('week')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                subView === 'week' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              週
            </button>
          </div>

          {/* Google Calendar toggle */}
          <div className="flex items-center gap-2">
            {gcalEnabled && gcalLoading && (
              <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            )}
            <button
              onClick={() => setGcalEnabled(!gcalEnabled)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                gcalEnabled
                  ? 'bg-[#4285f4] text-white border-[#4285f4] hover:bg-[#3367d6]'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
              </svg>
              Googleカレンダー
            </button>
          </div>
        </div>
      </div>

      {/* Reconnect banner */}
      {gcalEnabled && !tokenAvailable && !gcalLoading && (
        <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex-shrink-0">
          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-blue-700">Googleカレンダーの予定を表示するにはアカウントを接続してください</span>
          <button
            onClick={reconnect}
            className="ml-auto text-xs font-medium text-white bg-[#4285f4] hover:bg-[#3367d6] px-3 py-1 rounded transition-colors"
          >
            接続する
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mb-2 text-[11px] text-gray-500 flex-wrap flex-shrink-0">
        {(Object.entries(DEADLINE_TYPE_COLORS) as [DeadlineType, string][])
          .filter(([type]) => type !== 'document')
          .map(([type, color]) => (
            <span key={type} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              {DEADLINE_TYPE_LABELS[type]}
            </span>
          ))}
        {gcalEnabled && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#4285f4]" />
            Google
          </span>
        )}
      </div>

      {/* Month or Week view */}
      {subView === 'month' ? (
        <>
          {/* サイズ測定用の不可視レイヤー（グリッドの下に敷く） */}
          <div className="flex-1 min-h-0 relative">
            <div ref={gridContainerRef} className="absolute inset-0" />
            {cellSize > 0 && (
            <div className="absolute inset-0 flex flex-col items-center">
              {/* Weekday headers */}
              <div className="flex flex-shrink-0">
                {WEEKDAY_LABELS.map((label, i) => (
                  <div
                    key={label}
                    style={{ width: cellSize }}
                    className={`text-center text-xs font-medium py-2 border-b border-[var(--gcal-grid-border)] ${
                      i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div
                className="gcal-grid"
                style={{
                  gridTemplateColumns: `repeat(7, ${cellSize}px)`,
                  gridTemplateRows: `repeat(${numRows}, ${cellSize}px)`,
                }}
              >
                {calendarDays.map((dayInfo, idx) => {
                  const dayOfWeek = idx % 7;
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const isToday = dayInfo.dateStr === todayStr;

                  const cellClasses = [
                    'gcal-cell',
                    isToday && 'gcal-cell-today',
                    !isToday && isWeekend && dayInfo.isCurrentMonth && 'gcal-cell-weekend',
                  ].filter(Boolean).join(' ');

                  const dayNumberClasses = [
                    'gcal-day-number',
                    !dayInfo.isCurrentMonth && 'gcal-day-number-other-month',
                    isToday && 'gcal-day-number-today',
                    !isToday && dayInfo.isCurrentMonth && dayOfWeek === 0 && 'gcal-day-number-sunday',
                    !isToday && dayInfo.isCurrentMonth && dayOfWeek === 6 && 'gcal-day-number-saturday',
                  ].filter(Boolean).join(' ');

                  const deadlineEntries = deadlineMap.get(dayInfo.dateStr) || [];
                  const gcalEntries = gcalEnabled ? (gcalEventMap.get(dayInfo.dateStr) || []) : [];
                  const totalItems = deadlineEntries.length + gcalEntries.length;
                  const overflow = totalItems > MAX_ITEMS_PER_CELL ? totalItems - MAX_ITEMS_PER_CELL : 0;
                  const visibleDeadlines = overflow > 0
                    ? deadlineEntries.slice(0, Math.max(1, MAX_ITEMS_PER_CELL - gcalEntries.length))
                    : deadlineEntries;
                  const remainingSlots = MAX_ITEMS_PER_CELL - visibleDeadlines.length;
                  const visibleGcal = gcalEntries.slice(0, Math.max(0, remainingSlots));

                  return (
                    <div key={dayInfo.dateStr} className={cellClasses}>
                      <div className={dayNumberClasses}>{dayInfo.day}</div>
                      {dayInfo.isCurrentMonth && (
                        <div>
                          {visibleDeadlines.map(entry => (
                            <DeadlineChip key={`dl-${entry.company.id}-${entry.id}`} entry={entry} onCardClick={onCardClick} />
                          ))}
                          {visibleGcal.map(ev => (
                            <GcalChip key={`gcal-${ev.id}`} event={ev} />
                          ))}
                          {overflow > 0 && (
                            <button
                              className="gcal-overflow-link text-left w-full"
                              onClick={(e) => handleOverflowClick(e, dayInfo.dateStr, deadlineEntries, gcalEntries)}
                            >
                              他 {overflow} 件
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            )}
          </div>
        </>
      ) : (
        /* Week view */
        <>
          {/* Week header */}
          <div className="gcal-week-grid">
            {weekDays.map((wd) => {
              const isToday = wd.dateStr === todayStr;
              return (
                <div key={wd.dateStr} className="gcal-week-header-cell">
                  <div className={`text-xs font-medium ${
                    wd.dayOfWeek === 0 ? 'text-red-400' : wd.dayOfWeek === 6 ? 'text-blue-400' : 'text-gray-500'
                  }`}>
                    {WEEKDAY_LABELS[wd.dayOfWeek]}
                  </div>
                  <div className={`gcal-week-day-number ${isToday ? 'gcal-week-day-number-today' : ''}`}>
                    {wd.day}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Week body */}
          <div className="gcal-week-grid">
            {weekDays.map((wd) => {
              const isToday = wd.dateStr === todayStr;
              const isWeekend = wd.dayOfWeek === 0 || wd.dayOfWeek === 6;
              const deadlineEntries = deadlineMap.get(wd.dateStr) || [];
              const gcalEntries = gcalEnabled ? (gcalEventMap.get(wd.dateStr) || []) : [];

              const cellClasses = [
                'gcal-week-body-cell',
                isToday && 'gcal-week-body-cell-today',
                !isToday && isWeekend && 'gcal-week-body-cell-weekend',
              ].filter(Boolean).join(' ');

              return (
                <div key={wd.dateStr} className={cellClasses}>
                  {deadlineEntries.map(entry => (
                    <WeekDeadlineChip key={`dl-${entry.company.id}-${entry.id}`} entry={entry} onCardClick={onCardClick} />
                  ))}
                  {gcalEntries.map(ev => (
                    <WeekGcalChip key={`gcal-${ev.id}`} event={ev} />
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Popover */}
      {popover && (
        <PopoverOverlay
          ref={popoverRef}
          popover={popover}
          onClose={() => setPopover(null)}
          onCardClick={onCardClick}
        />
      )}
    </div>
  );
}

/* ──── DeadlineChip (month view) ──── */
function DeadlineChip({ entry, onCardClick }: { entry: DeadlineWithCompany; onCardClick: (c: Company) => void }) {
  const color = getDeadlineTypeColor(entry.type);
  return (
    <button
      onClick={() => onCardClick(entry.company)}
      className="gcal-event-chip w-full text-left"
      title={`${entry.company.name} - ${entry.label}${entry.memo ? `\n${entry.memo}` : ''}`}
    >
      <span className="gcal-event-dot" style={{ backgroundColor: color }} />
      <span className="gcal-event-text">
        {entry.time && <span className="gcal-event-time">{formatTimeJP(entry.time)} </span>}
        {entry.company.name}
      </span>
    </button>
  );
}

/* ──── GcalChip (month view) ──── */
function GcalChip({ event }: { event: CalendarEventDisplay }) {
  return (
    <a
      href={event.htmlLink}
      target="_blank"
      rel="noopener noreferrer"
      className="gcal-event-chip w-full text-left"
      title={event.title}
    >
      <span className="gcal-event-dot-outline" style={{ borderColor: '#4285f4' }} />
      <span className="gcal-event-text">
        {event.startTime && <span className="gcal-event-time">{formatTimeJP(event.startTime)} </span>}
        {event.title}
      </span>
    </a>
  );
}

/* ──── WeekDeadlineChip ──── */
function WeekDeadlineChip({ entry, onCardClick }: { entry: DeadlineWithCompany; onCardClick: (c: Company) => void }) {
  const color = getDeadlineTypeColor(entry.type);
  return (
    <button
      onClick={() => onCardClick(entry.company)}
      className="gcal-week-event-chip text-left w-full"
      style={{ borderLeftColor: color, backgroundColor: `${color}0d` }}
      title={`${entry.company.name} - ${entry.label}`}
    >
      <span className="font-medium text-gray-900 truncate">{entry.company.name}</span>
      <span className="text-gray-500 truncate">{entry.label}{entry.time ? ` ${formatTimeJP(entry.time)}` : ''}</span>
      {entry.memo && <span className="text-gray-400 truncate text-[11px]">{entry.memo}</span>}
    </button>
  );
}

/* ──── WeekGcalChip ──── */
function WeekGcalChip({ event }: { event: CalendarEventDisplay }) {
  return (
    <a
      href={event.htmlLink}
      target="_blank"
      rel="noopener noreferrer"
      className="gcal-week-event-chip border-l-[#4285f4] text-left w-full"
      title={event.title}
    >
      <span className="font-medium text-blue-800 truncate">{event.title}</span>
      {event.startTime && <span className="text-blue-500 text-[11px]">{formatTimeJP(event.startTime)}</span>}
    </a>
  );
}

/* ──── Popover ──── */
interface PopoverProps {
  popover: {
    dateStr: string;
    deadlines: DeadlineWithCompany[];
    gcalEvents: CalendarEventDisplay[];
    rect: DOMRect;
  };
  onClose: () => void;
  onCardClick: (c: Company) => void;
}

const PopoverOverlay = forwardRef<HTMLDivElement, PopoverProps>(({ popover, onClose, onCardClick }, ref) => {
  const d = new Date(popover.dateStr + 'T00:00:00');
  const title = `${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAY_LABELS[d.getDay()]}）`;

  // Position near the clicked element
  const style: React.CSSProperties = {
    top: Math.min(popover.rect.bottom + 4, window.innerHeight - 440),
    left: Math.min(popover.rect.left, window.innerWidth - 400),
  };

  return (
    <div ref={ref} className="gcal-popover" style={style}>
      <div className="gcal-popover-header">
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        <button className="gcal-popover-close" onClick={onClose}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="gcal-popover-body">
        {popover.deadlines.map(entry => {
          const color = getDeadlineTypeColor(entry.type);
          const urgency = getDeadlineUrgency(entry.date);
          const urgencyLabel = urgency === 'overdue' ? '期限切れ' : urgency === 'urgent' ? '緊急' : null;
          return (
            <button
              key={`pop-dl-${entry.company.id}-${entry.id}`}
              className="gcal-popover-entry w-full text-left hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => { onCardClick(entry.company); onClose(); }}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: color }} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">
                  {entry.company.name}
                  {urgencyLabel && <span className="ml-1.5 text-[10px] text-red-500 font-normal">{urgencyLabel}</span>}
                </div>
                <div className="text-gray-500 text-xs">
                  {entry.label}{entry.time ? ` ${formatTimeJP(entry.time)}` : ''}
                </div>
                {entry.memo && (
                  <div className="text-gray-400 text-xs mt-0.5 truncate">{entry.memo}</div>
                )}
              </div>
            </button>
          );
        })}
        {popover.gcalEvents.map(ev => (
          <a
            key={`pop-gcal-${ev.id}`}
            href={ev.htmlLink}
            target="_blank"
            rel="noopener noreferrer"
            className="gcal-popover-entry hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#4285f4] flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-blue-800">{ev.title}</div>
              {ev.startTime && <div className="text-blue-500 text-xs">{formatTimeJP(ev.startTime)}</div>}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
});
