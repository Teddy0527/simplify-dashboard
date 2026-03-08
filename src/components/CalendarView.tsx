import { useState, useMemo, useRef, useEffect } from 'react';
import type { Company } from '@jobsimplify/shared';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { getStageColor, formatStageLabel, formatTimeJP } from '../utils/stageCalendarHelpers';

interface CalendarViewProps {
  companies: Company[];
  onCardClick: (company: Company) => void;
}

type CalendarMode = 'month' | 'week';

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

export default function CalendarView({ companies, onCardClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [mode, setMode] = useState<CalendarMode>('month');

  // Popover state for overflow items
  const [popover, setPopover] = useState<{ dateStr: string; rect: DOMRect } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Calculate time range for Google Calendar events
  const { timeMin, timeMax } = useMemo(() => {
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
      else d.setDate(d.getDate() + delta * 7);
      return d;
    });
    setPopover(null);
  }

  function goToday() {
    setCurrentDate(new Date());
    setPopover(null);
  }

  // Header label
  const headerLabel = useMemo(() => {
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

    return (
      <div className="gcal-grid gcal-grid-tight">
        {/* Weekday headers */}
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={`gcal-cell gcal-cell-no-click text-center text-xs font-medium py-1.5 ${
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
                'gcal-cell-no-click',
                isWeekend && 'gcal-cell-weekend',
                isToday && 'gcal-cell-today',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ minHeight: 90 }}
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
                      onClick={() => company && onCardClick(company)}
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
                    onClick={() => window.open(ge.htmlLink, '_blank')}
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
  function renderWeekGrid() {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }

    return (
      <div className="gcal-week-grid">
        {/* Header */}
        {days.map((d) => {
          const ds = toDateStr(d);
          const dow = d.getDay();
          const isToday = ds === todayStr;
          return (
            <div
              key={ds + '-h'}
              className={`gcal-week-header-cell ${dow === 0 || dow === 6 ? 'gcal-cell-weekend' : ''}`}
            >
              <div
                className={`text-xs font-medium ${
                  dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-gray-500'
                }`}
              >
                {WEEKDAY_LABELS[dow]}
              </div>
              <div
                className={`gcal-week-day-number ${isToday ? 'gcal-week-day-number-today' : ''}`}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}

        {/* Body */}
        {days.map((d) => {
          const ds = toDateStr(d);
          const dow = d.getDay();
          const isToday = ds === todayStr;
          const isWeekend = dow === 0 || dow === 6;
          const data = eventsByDate.get(ds);
          const stages = data?.stages ?? [];
          const gcals = data?.gcal ?? [];

          return (
            <div
              key={ds + '-b'}
              className={[
                'gcal-week-body-cell',
                isToday && 'gcal-week-body-cell-today',
                isWeekend && 'gcal-week-body-cell-weekend',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {stages.map((se) => {
                const colors = getStageColor(se.stage.type);
                const company = findCompany(se.companyId);
                return (
                  <div
                    key={`${se.companyId}-${se.stage.type}`}
                    className="gcal-week-event-chip"
                    style={{
                      backgroundColor: colors.bg,
                      borderLeftColor: colors.border,
                    }}
                    onClick={() => company && onCardClick(company)}
                  >
                    <div className="font-medium" style={{ color: colors.text }}>
                      {se.companyName}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {formatStageLabel(se.stage)}
                      {se.stage.time && ` ${formatTimeJP(se.stage.time)}`}
                    </div>
                  </div>
                );
              })}
              {gcals.map((ge) => (
                <div
                  key={ge.id}
                  className="gcal-week-event-chip"
                  style={{
                    backgroundColor: 'var(--gcal-blue-light)',
                    borderLeftColor: ge.color || 'var(--gcal-blue)',
                  }}
                  onClick={() => window.open(ge.htmlLink, '_blank')}
                >
                  <div className="font-medium text-gray-700">{ge.title}</div>
                  {ge.startTime && (
                    <div className="text-xs text-gray-500">
                      {ge.startTime}
                      {ge.endTime && ` - ${ge.endTime}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

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
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200">
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

        {/* Month / Week toggle */}
        <div className="flex rounded-lg bg-gray-100 p-0.5">
          <button
            onClick={() => { setMode('month'); setPopover(null); }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === 'month'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            月
          </button>
          <button
            onClick={() => { setMode('week'); setPopover(null); }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === 'week'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            週
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto bg-white">
        {mode === 'month' ? renderMonthGrid() : renderWeekGrid()}
      </div>

      {renderPopover()}
    </div>
  );
}
