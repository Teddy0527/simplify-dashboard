import { useState, useMemo } from 'react';
import type { CalendarEventDisplay } from '../../types/googleCalendar';
import CalendarEventChip from './CalendarEventChip';
import CalendarDayPopover from './CalendarDayPopover';

interface CalendarMonthViewProps {
  year: number;
  month: number; // 0-indexed
  events: CalendarEventDisplay[];
  onEventClick?: (event: CalendarEventDisplay) => void;
}

const WEEKDAY_HEADERS = ['日', '月', '火', '水', '木', '金', '土'];
const MAX_VISIBLE_EVENTS = 3;

function getMonthGrid(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const start = new Date(year, month, 1 - startDay);

  const weeks: Date[][] = [];
  const current = new Date(start);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    if (w >= 4 && week[0].getMonth() !== month) break;
  }
  return weeks;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isToday(d: Date): boolean {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

/**
 * Sort events: all-day first, then timed events by startTime
 */
function sortDayEvents(events: CalendarEventDisplay[]): CalendarEventDisplay[] {
  return [...events].sort((a, b) => {
    if (a.isAllDay && !b.isAllDay) return -1;
    if (!a.isAllDay && b.isAllDay) return 1;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });
}

export default function CalendarMonthView({ year, month, events, onEventClick }: CalendarMonthViewProps) {
  const [popover, setPopover] = useState<{ dateStr: string; events: CalendarEventDisplay[]; rect: DOMRect } | null>(null);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventDisplay[]>();
    for (const e of events) {
      const list = map.get(e.dateStr) || [];
      list.push(e);
      map.set(e.dateStr, list);
    }
    // Sort each day's events
    for (const [key, list] of map) {
      map.set(key, sortDayEvents(list));
    }
    return map;
  }, [events]);

  const weeks = useMemo(() => getMonthGrid(year, month), [year, month]);

  function handleCellClick(dateStr: string, dayEvents: CalendarEventDisplay[], cellEl: HTMLElement) {
    if (dayEvents.length === 0) return;
    const rect = cellEl.getBoundingClientRect();
    setPopover({ dateStr, events: dayEvents, rect });
  }

  return (
    <div>
      {/* Header */}
      <div className="gcal-grid" style={{ borderBottom: 'none' }}>
        {WEEKDAY_HEADERS.map((name, i) => (
          <div
            key={name}
            className="gcal-cell gcal-cell-no-click"
            style={{
              textAlign: 'center',
              padding: '8px 0',
              fontSize: '12px',
              fontWeight: 500,
              color: i === 0 ? '#d50000' : i === 6 ? '#1a73e8' : 'var(--color-gray-500)',
              borderBottom: '1px solid var(--gcal-grid-border)',
            }}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="gcal-grid">
        {weeks.map((week, wi) =>
          week.map((date, di) => {
            const dateStr = toDateStr(date);
            const dayEvents = eventsByDate.get(dateStr) || [];
            const isCurrentMonth = date.getMonth() === month;
            const today = isToday(date);
            const isWeekend = di === 0 || di === 6;

            const cellClasses = [
              'gcal-cell',
              isWeekend && 'gcal-cell-weekend',
              today && 'gcal-cell-today',
            ].filter(Boolean).join(' ');

            const dayNumClasses = [
              'gcal-day-number',
              !isCurrentMonth && 'gcal-day-number-other-month',
              today && 'gcal-day-number-today',
              di === 0 && isCurrentMonth && !today && 'gcal-day-number-sunday',
              di === 6 && isCurrentMonth && !today && 'gcal-day-number-saturday',
            ].filter(Boolean).join(' ');

            const overflow = dayEvents.length - MAX_VISIBLE_EVENTS;

            return (
              <div
                key={`${wi}-${di}`}
                className={cellClasses}
                style={{ height: `calc((100vh - 160px) / ${weeks.length})` }}
                onClick={(e) => handleCellClick(dateStr, dayEvents, e.currentTarget)}
              >
                <div className={dayNumClasses}>{date.getDate()}</div>
                {dayEvents.slice(0, MAX_VISIBLE_EVENTS).map((ev) => (
                  <CalendarEventChip key={ev.id} event={ev} compact onClick={onEventClick} />
                ))}
                {overflow > 0 && (
                  <span className="gcal-overflow-link">
                    他 {overflow} 件
                  </span>
                )}
              </div>
            );
          }),
        )}
      </div>

      {popover && (
        <CalendarDayPopover
          dateStr={popover.dateStr}
          events={popover.events}
          anchorRect={popover.rect}
          onClose={() => setPopover(null)}
          onEventClick={onEventClick}
        />
      )}
    </div>
  );
}
