import { useState, useMemo, useRef, useEffect } from 'react';
import type { Company, SelectionStage } from '@jobsimplify/shared';
import { STATUS_LABELS } from '@jobsimplify/shared';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import { getStageColor, formatStageLabel, formatTimeJP } from '../utils/stageCalendarHelpers';
import type { CalendarEventDisplay } from '../types/googleCalendar';
import CalendarAddPopover from './calendar/CalendarAddPopover';
import CalendarWeekView from './calendar/CalendarWeekView';
import CalendarViewSwitcher from './calendar/CalendarViewSwitcher';
import type { ViewMode } from './FilterBar';

interface CalendarViewProps {
  companies: Company[];
  onCardClick: (company: Company) => void;
  onAddStage?: (companyId: string, stage: SelectionStage) => void;
  onCreateCompanyAndStage?: (companyName: string, stage: SelectionStage) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onAddClick: () => void;
}

type CalendarMode = 'month' | 'week' | 'day';

interface StageEvent {
  companyId: string;
  companyName: string;
  stage: Company['stages'][number];
  dateStr: string;
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addHour(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const newH = Math.min(h + 1, 23);
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function CalendarView({ companies, onCardClick, onAddStage, onCreateCompanyAndStage, viewMode, onViewModeChange, onAddClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [mode, setMode] = useState<CalendarMode>('month');

  // Popover state for overflow items
  const [popover, setPopover] = useState<{ dateStr: string; rect: DOMRect } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Add popover state
  const [addPopover, setAddPopover] = useState<{ dateStr: string; rect: DOMRect; time?: string } | null>(null);

  // Google Calendar connection status
  const { isConnected: gcalConnected, googleEmail: gcalEmail, connect: gcalConnect, isTestUserApproved } = useGoogleCalendar();

  // Calculate time range for Google Calendar events
  const { timeMin, timeMax } = useMemo(() => {
    if (mode === 'day') {
      return {
        timeMin: toDateStr(currentDate) + 'T00:00:00Z',
        timeMax: toDateStr(currentDate) + 'T23:59:59Z',
      };
    }
    if (mode === 'month') {
      const y = currentDate.getFullYear();
      const m = currentDate.getMonth();
      const first = new Date(y, m, 1);
      const last = new Date(y, m + 1, 0);
      // Extend to cover visible grid days
      first.setDate(first.getDate() - first.getDay());
      last.setDate(last.getDate() + (6 - last.getDay()));
      return {
        timeMin: toDateStr(first) + 'T00:00:00Z',
        timeMax: toDateStr(last) + 'T23:59:59Z',
      };
    }
    // Week mode
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return {
      timeMin: toDateStr(start) + 'T00:00:00Z',
      timeMax: toDateStr(end) + 'T23:59:59Z',
    };
  }, [currentDate, mode]);

  const { events: googleEvents } = useCalendarEvents(timeMin, timeMax);

  // Build stage events from companies
  const stageEvents = useMemo<StageEvent[]>(() => {
    const result: StageEvent[] = [];
    for (const company of companies) {
      for (const stage of company.stages) {
        if (stage.date) {
          result.push({
            companyId: company.id,
            companyName: company.name,
            stage,
            dateStr: stage.date,
          });
        }
      }
    }
    return result;
  }, [companies]);

  // Convert stage events to CalendarEventDisplay for week view
  const stageCalendarEvents = useMemo<CalendarEventDisplay[]>(() => {
    return stageEvents.map((se) => ({
      id: `${se.companyId}-${se.stage.type}`,
      title: `${se.companyName} - ${STATUS_LABELS[se.stage.type] ?? se.stage.type}`,
      dateStr: se.dateStr,
      startTime: se.stage.time,
      endTime: se.stage.endTime || (se.stage.time ? addHour(se.stage.time) : undefined),
      isAllDay: !se.stage.time,
      htmlLink: '',
      source: 'stage' as const,
      companyId: se.companyId,
      color: getStageColor(se.stage.type).border,
    }));
  }, [stageEvents]);

  // Group events by dateStr
  const eventsByDate = useMemo(() => {
    const map = new Map<string, { stages: StageEvent[]; gcal: typeof googleEvents }>();
    for (const se of stageEvents) {
      if (!map.has(se.dateStr)) map.set(se.dateStr, { stages: [], gcal: [] });
      map.get(se.dateStr)!.stages.push(se);
    }
    for (const ge of googleEvents) {
      if (!map.has(ge.dateStr)) map.set(ge.dateStr, { stages: [], gcal: [] });
      map.get(ge.dateStr)!.gcal.push(ge);
    }
    return map;
  }, [stageEvents, googleEvents]);

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

  // Navigation
  function navigate(delta: number) {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (mode === 'month') d.setMonth(d.getMonth() + delta);
      else if (mode === 'week') d.setDate(d.getDate() + delta * 7);
      else d.setDate(d.getDate() + delta);
      return d;
    });
    setPopover(null);
    setAddPopover(null);
  }

  function goToday() {
    setCurrentDate(new Date());
    setPopover(null);
    setAddPopover(null);
  }

  // Header label
  const headerLabel = useMemo(() => {
    if (mode === 'day') {
      return `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月${currentDate.getDate()}日（${WEEKDAY_LABELS[currentDate.getDay()]}）`;
    }
    if (mode === 'month') {
      return `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
    }
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const sm = start.getMonth() + 1;
    const em = end.getMonth() + 1;
    if (sm === em) {
      return `${start.getFullYear()}年${sm}月${start.getDate()}日 - ${end.getDate()}日`;
    }
    return `${sm}月${start.getDate()}日 - ${em}月${end.getDate()}日`;
  }, [currentDate, mode]);

  const todayStr = toDateStr(new Date());

  function findCompany(id: string) {
    return companies.find((c) => c.id === id);
  }

  // ─── Month view ─────────────────────────────────────
  function renderMonthGrid() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Calculate total cells: fill 5 or 6 rows
    const totalCells = startOffset + daysInMonth > 35 ? 42 : 35;

    const cells: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < totalCells; i++) {
      if (i < startOffset) {
        const d = new Date(year, month - 1, prevMonthDays - startOffset + i + 1);
        cells.push({ date: d, isCurrentMonth: false });
      } else if (i < startOffset + daysInMonth) {
        const d = new Date(year, month, i - startOffset + 1);
        cells.push({ date: d, isCurrentMonth: true });
      } else {
        const d = new Date(year, month + 1, i - startOffset - daysInMonth + 1);
        cells.push({ date: d, isCurrentMonth: false });
      }
    }

    const MAX_VISIBLE = 3;
    const numRows = totalCells / 7;
    const CALENDAR_CHROME_HEIGHT = 104;
    const cellHeight = `calc((100vh - ${CALENDAR_CHROME_HEIGHT}px) / ${numRows})`;

    return (
      <div className="gcal-grid gcal-grid-tight">
        {/* Weekday headers */}
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={`gcal-cell gcal-cell-header text-center text-xs font-medium py-1.5 ${
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            {label}
          </div>
        ))}

        {cells.map(({ date, isCurrentMonth }) => {
          const ds = toDateStr(date);
          const dayOfWeek = date.getDay();
          const isToday = ds === todayStr;
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const data = eventsByDate.get(ds);
          const allItems = [
            ...(data?.stages ?? []).map((s) => ({ type: 'stage' as const, data: s })),
            ...(data?.gcal ?? []).map((g) => ({ type: 'gcal' as const, data: g })),
          ];
          const visible = allItems.slice(0, MAX_VISIBLE);
          const overflow = allItems.length - MAX_VISIBLE;

          return (
            <div
              key={ds}
              className={[
                'gcal-cell',
                onAddStage ? 'gcal-cell-clickable' : 'gcal-cell-no-click',
                isWeekend && 'gcal-cell-weekend',
                isToday && 'gcal-cell-today',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ minHeight: cellHeight }}
              onClick={(e) => {
                if (!onAddStage) return;
                const rect = e.currentTarget.getBoundingClientRect();
                setAddPopover({ dateStr: ds, rect });
              }}
            >
              {/* Day number */}
              <div
                className={[
                  'gcal-day-number',
                  !isCurrentMonth && 'gcal-day-number-other-month',
                  isToday && 'gcal-day-number-today',
                  dayOfWeek === 0 && !isToday && 'gcal-day-number-sunday',
                  dayOfWeek === 6 && !isToday && 'gcal-day-number-saturday',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {date.getDate()}
              </div>

              {/* Add hint icon */}
              {onAddStage && <div className="gcal-cell-add-hint">+</div>}

              {/* Events */}
              {visible.map((item) => {
                if (item.type === 'stage') {
                  const se = item.data;
                  const colors = getStageColor(se.stage.type);
                  const company = findCompany(se.companyId);
                  return (
                    <div
                      key={`${se.companyId}-${se.stage.type}`}
                      className="gcal-deadline-chip"
                      style={{
                        backgroundColor: colors.bg,
                        borderLeftColor: colors.border,
                        color: colors.text,
                      }}
                      onClick={(e) => { e.stopPropagation(); company && onCardClick(company); }}
                      title={`${se.companyName} - ${formatStageLabel(se.stage)}`}
                    >
                      <span className="gcal-event-text">
                        {formatTimeJP(se.stage.time) && (
                          <span className="gcal-event-time">{formatTimeJP(se.stage.time)} </span>
                        )}
                        {se.companyName} {formatStageLabel(se.stage)}
                      </span>
                    </div>
                  );
                }
                // Google Calendar event
                const ge = item.data;
                return (
                  <div
                    key={ge.id}
                    className="gcal-event-chip"
                    onClick={(e) => { e.stopPropagation(); window.open(ge.htmlLink, '_blank'); }}
                    title={ge.title}
                  >
                    <span
                      className="gcal-event-dot"
                      style={{ backgroundColor: ge.color || 'var(--gcal-blue)' }}
                    />
                    <span className="gcal-event-text">
                      {ge.startTime && (
                        <span className="gcal-event-time">{ge.startTime} </span>
                      )}
                      {ge.title}
                    </span>
                  </div>
                );
              })}

              {overflow > 0 && (
                <button
                  className="gcal-overflow-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setPopover({ dateStr: ds, rect });
                  }}
                >
                  他{overflow}件
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ─── Week view ──────────────────────────────────────
  const weekStartDate = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, [currentDate]);

  const weekViewEvents = useMemo<CalendarEventDisplay[]>(
    () => [...googleEvents, ...stageCalendarEvents],
    [googleEvents, stageCalendarEvents],
  );

  function handleWeekEventClick(event: CalendarEventDisplay) {
    if (event.source === 'stage' && event.companyId) {
      const company = findCompany(event.companyId);
      if (company) onCardClick(company);
    } else if (event.source === 'google' && event.htmlLink) {
      window.open(event.htmlLink, '_blank');
    }
  }

  function handleSlotClick(dateStr: string, time: string, rect: DOMRect) {
    if (!onAddStage) return;
    setAddPopover({ dateStr, rect, time });
  }

  // Keyboard shortcuts: D/W/M to switch view
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'd') { setMode('day'); setPopover(null); setAddPopover(null); }
      else if (key === 'w') { setMode('week'); setPopover(null); setAddPopover(null); }
      else if (key === 'm') { setMode('month'); setPopover(null); setAddPopover(null); }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // ─── Popover ────────────────────────────────────────
  function renderPopover() {
    if (!popover) return null;
    const data = eventsByDate.get(popover.dateStr);
    if (!data) return null;
    const allItems = [
      ...(data.stages ?? []).map((s) => ({ type: 'stage' as const, data: s })),
      ...(data.gcal ?? []).map((g) => ({ type: 'gcal' as const, data: g })),
    ];

    const popDate = new Date(popover.dateStr + 'T00:00:00');
    const label = `${popDate.getMonth() + 1}月${popDate.getDate()}日（${WEEKDAY_LABELS[popDate.getDay()]}）`;

    // Position
    const top = Math.min(popover.rect.bottom + 4, window.innerHeight - 400);
    const left = Math.min(popover.rect.left, window.innerWidth - 380);

    return (
      <div
        ref={popoverRef}
        className="gcal-popover"
        style={{ top, left }}
      >
        <div className="gcal-popover-header">
          <span className="text-sm font-semibold text-gray-800">{label}</span>
          <button className="gcal-popover-close" onClick={() => setPopover(null)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="gcal-popover-body">
          {allItems.map((item) => {
            if (item.type === 'stage') {
              const se = item.data;
              const colors = getStageColor(se.stage.type);
              const company = findCompany(se.companyId);
              return (
                <div key={`${se.companyId}-${se.stage.type}`} className="gcal-popover-entry">
                  <span
                    className="gcal-event-dot-outline"
                    style={{ borderColor: colors.border }}
                  />
                  <div className="flex-1 min-w-0">
                    <button
                      className="text-sm font-medium text-gray-800 hover:underline text-left"
                      onClick={() => company && onCardClick(company)}
                    >
                      {se.companyName}
                    </button>
                    <div className="text-xs text-gray-500">
                      {formatStageLabel(se.stage)}
                      {se.stage.time && ` ${formatTimeJP(se.stage.time)}`}
                    </div>
                  </div>
                </div>
              );
            }
            const ge = item.data;
            return (
              <div key={ge.id} className="gcal-popover-entry">
                <span
                  className="gcal-event-dot"
                  style={{ backgroundColor: ge.color || 'var(--gcal-blue)' }}
                />
                <div className="flex-1 min-w-0">
                  <a
                    href={ge.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-gray-800 hover:underline"
                  >
                    {ge.title}
                  </a>
                  {ge.startTime && (
                    <div className="text-xs text-gray-500">
                      {ge.startTime}{ge.endTime && ` - ${ge.endTime}`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-2.5 bg-white border-b border-gray-200 flex-shrink-0">
        {/* View mode toggle (kanban / calendar) */}
        <div className="flex rounded-lg bg-gray-100 p-0.5">
          <button
            onClick={() => onViewModeChange('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'kanban'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            カンバン
          </button>
          <button
            onClick={() => onViewModeChange('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'calendar'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            カレンダー
          </button>
        </div>

        {/* Navigation */}
        <button
          onClick={goToday}
          className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          今日
        </button>
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => navigate(1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <span className="text-base font-semibold text-gray-800">{headerLabel}</span>

        <div className="flex-1" />

        {/* Google Calendar connection status */}
        {gcalConnected ? (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <span className="hidden sm:inline">Google連携中</span>
            {gcalEmail && (
              <span className="hidden md:inline text-gray-400 max-w-[140px] truncate">{gcalEmail}</span>
            )}
          </div>
        ) : isTestUserApproved ? (
          <button
            onClick={gcalConnect}
            className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
            </svg>
            <span className="hidden sm:inline">Googleカレンダーを連携</span>
          </button>
        ) : (
          <a
            href="/settings"
            className="flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: '#d97706' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="hidden sm:inline">テストユーザー募集中</span>
          </a>
        )}

        {/* View mode switcher (day/week/month) */}
        <CalendarViewSwitcher
          mode={mode}
          onModeChange={(m) => { setMode(m); setPopover(null); setAddPopover(null); }}
        />

        {/* Add button */}
        <button
          onClick={onAddClick}
          className="btn-primary text-sm py-1.5 px-3 whitespace-nowrap"
        >
          + 追加
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-hidden bg-white">
        {mode === 'day' ? (
          <CalendarWeekView
            singleDay={currentDate}
            events={weekViewEvents}
            onEventClick={handleWeekEventClick}
            onSlotClick={onAddStage ? handleSlotClick : undefined}
          />
        ) : mode === 'week' ? (
          <CalendarWeekView
            weekStart={weekStartDate}
            events={weekViewEvents}
            onEventClick={handleWeekEventClick}
            onSlotClick={onAddStage ? handleSlotClick : undefined}
          />
        ) : renderMonthGrid()}
      </div>

      {renderPopover()}

      {addPopover && onAddStage && onCreateCompanyAndStage && (
        <CalendarAddPopover
          dateStr={addPopover.dateStr}
          anchorRect={addPopover.rect}
          companies={companies}
          onAddStage={onAddStage}
          onCreateCompanyAndStage={onCreateCompanyAndStage}
          onClose={() => setAddPopover(null)}
          initialTime={addPopover.time}
        />
      )}
    </div>
  );
}
