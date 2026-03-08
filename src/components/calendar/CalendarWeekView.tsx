import { useMemo, useRef, useEffect } from 'react';
import type { CalendarEventDisplay } from '../../types/googleCalendar';
import { formatTimeJa, calculateEventPositions } from '../../utils/calendarUtils';

interface CalendarWeekViewProps {
  weekStart: Date; // Sunday of the week
  events: CalendarEventDisplay[];
  onEventClick?: (event: CalendarEventDisplay) => void;
}

const WEEKDAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
const HOUR_HEIGHT = 48; // px per hour
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isToday(d: Date): boolean {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function getWeekDays(start: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return '午前0時';
  if (hour < 12) return `午前${hour}時`;
  if (hour === 12) return '午後0時';
  return `午後${hour - 12}時`;
}

function getCurrentTimePosition(): number {
  const now = new Date();
  return (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;
}

export default function CalendarWeekView({ weekStart, events, onEventClick }: CalendarWeekViewProps) {
  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventDisplay[]>();
    for (const e of events) {
      const list = map.get(e.dateStr) || [];
      list.push(e);
      map.set(e.dateStr, list);
    }
    return map;
  }, [events]);

  // Get all-day events by date
  const allDayByDate = useMemo(() => {
    const map = new Map<string, CalendarEventDisplay[]>();
    for (const e of events) {
      if (!e.isAllDay) continue;
      const list = map.get(e.dateStr) || [];
      list.push(e);
      map.set(e.dateStr, list);
    }
    return map;
  }, [events]);

  // Positioned timed events by date
  const positionedByDate = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateEventPositions>>();
    for (const [dateStr, dayEvents] of eventsByDate) {
      map.set(dateStr, calculateEventPositions(dayEvents));
    }
    return map;
  }, [eventsByDate]);

  // Check if any day has all-day events
  const hasAllDayEvents = useMemo(() => {
    for (const d of days) {
      const dateStr = toDateStr(d);
      if ((allDayByDate.get(dateStr) || []).length > 0) return true;
    }
    return false;
  }, [days, allDayByDate]);

  // Max all-day events across any day (for section height)
  const maxAllDay = useMemo(() => {
    let max = 0;
    for (const d of days) {
      const dateStr = toDateStr(d);
      const count = (allDayByDate.get(dateStr) || []).length;
      if (count > max) max = count;
    }
    return max;
  }, [days, allDayByDate]);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const scrollTo = Math.max(0, (now.getHours() - 2) * HOUR_HEIGHT);
      scrollRef.current.scrollTop = scrollTo;
    }
  }, [weekStart]);

  // Current time indicator position
  const todayIndex = days.findIndex(isToday);
  const nowPosition = getCurrentTimePosition();

  return (
    <div className="gcal-weekview">
      {/* Header row: day names + numbers */}
      <div className="gcal-weekview-header">
        <div className="gcal-weekview-gutter" />
        {days.map((d, i) => {
          const today = isToday(d);
          return (
            <div
              key={i}
              className={`gcal-weekview-header-cell ${today ? 'gcal-weekview-header-cell-today' : ''}`}
            >
              <div
                className="gcal-weekview-day-label"
                style={{
                  color: today
                    ? 'var(--gcal-blue)'
                    : i === 0
                      ? '#d50000'
                      : i === 6
                        ? '#1a73e8'
                        : 'var(--color-gray-500)',
                }}
              >
                {WEEKDAY_NAMES[i]}
              </div>
              <div
                className={`gcal-weekview-day-number ${today ? 'gcal-weekview-day-number-today' : ''}`}
                style={
                  !today
                    ? {
                        color: i === 0 ? '#d50000' : i === 6 ? '#1a73e8' : 'var(--color-gray-800)',
                      }
                    : undefined
                }
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day section */}
      {hasAllDayEvents && (
        <div className="gcal-weekview-allday">
          <div className="gcal-weekview-gutter gcal-weekview-allday-label">終日</div>
          {days.map((d, i) => {
            const dateStr = toDateStr(d);
            const allDay = allDayByDate.get(dateStr) || [];
            const today = isToday(d);

            return (
              <div
                key={i}
                className={`gcal-weekview-allday-cell ${today ? 'gcal-weekview-allday-cell-today' : ''}`}
                style={{ minHeight: maxAllDay * 26 + 4 }}
              >
                {allDay.map((ev) => {
                  const isGoogle = ev.source === 'google';
                  const color = ev.color || (isGoogle ? '#9ca3af' : '#9ca3af');
                  return (
                    <div
                      key={ev.id}
                      className="gcal-allday-pill"
                      style={{ backgroundColor: isGoogle ? '#9ca3af' : color }}
                      onClick={() => onEventClick?.(ev)}
                    >
                      <span className="gcal-allday-pill-text">{ev.title}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Time grid (scrollable) */}
      <div ref={scrollRef} className="gcal-weekview-scroll custom-scrollbar">
        <div className="gcal-weekview-body" style={{ height: 24 * HOUR_HEIGHT }}>
          {/* Hour rows (grid lines + labels) */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="gcal-weekview-hour-row"
              style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
            >
              <div className="gcal-weekview-gutter gcal-weekview-hour-label">
                {hour > 0 && formatHourLabel(hour)}
              </div>
              <div className="gcal-weekview-hour-line" />
            </div>
          ))}

          {/* Day columns */}
          <div className="gcal-weekview-columns">
            <div className="gcal-weekview-gutter" />
            {days.map((d, i) => {
              const dateStr = toDateStr(d);
              const positioned = positionedByDate.get(dateStr) || [];
              const today = isToday(d);
              const isWeekend = i === 0 || i === 6;

              return (
                <div
                  key={i}
                  className={`gcal-weekview-column ${today ? 'gcal-weekview-column-today' : ''} ${isWeekend && !today ? 'gcal-weekview-column-weekend' : ''}`}
                >
                  {positioned.map((pe) => {
                    const isGoogle = pe.event.source === 'google';
                    const color = pe.event.color || (isGoogle ? '#9ca3af' : '#9ca3af');
                    const top = pe.startHour * HOUR_HEIGHT;
                    const height = Math.max((pe.endHour - pe.startHour) * HOUR_HEIGHT, 20);
                    const width = `calc(${100 / pe.totalColumns}% - 2px)`;
                    const left = `calc(${(pe.column * 100) / pe.totalColumns}% + 1px)`;

                    const startLabel = pe.event.startTime ? formatTimeJa(pe.event.startTime) : '';
                    const endLabel = pe.event.endTime ? formatTimeJa(pe.event.endTime) : '';

                    return (
                      <div
                        key={pe.event.id}
                        className="gcal-weekview-event"
                        style={{
                          top,
                          height,
                          width,
                          left,
                          backgroundColor: isGoogle ? '#e8eaed' : `${color}20`,
                          borderLeft: `3px solid ${isGoogle ? '#9ca3af' : color}`,
                        }}
                        onClick={() => onEventClick?.(pe.event)}
                      >
                        <div className="gcal-weekview-event-title">{pe.event.title}</div>
                        {height >= 36 && startLabel && (
                          <div className="gcal-weekview-event-time">
                            {startLabel}
                            {endLabel && ` - ${endLabel}`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Current time indicator */}
          {todayIndex >= 0 && (
            <div
              className="gcal-weekview-now-line"
              style={{ top: nowPosition }}
            >
              <div className="gcal-weekview-gutter" />
              {days.map((_, i) => (
                <div key={i} className="gcal-weekview-now-segment">
                  {i === todayIndex && (
                    <>
                      <div className="gcal-weekview-now-dot" />
                      <div className="gcal-weekview-now-bar" />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
