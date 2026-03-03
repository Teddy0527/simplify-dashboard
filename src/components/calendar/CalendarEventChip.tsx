import type { CalendarEventDisplay } from '../../types/googleCalendar';
import { formatTimeJa } from '../../utils/calendarUtils';

interface CalendarEventChipProps {
  event: CalendarEventDisplay;
  compact?: boolean;
  onClick?: (event: CalendarEventDisplay) => void;
}

export default function CalendarEventChip({ event, onClick }: CalendarEventChipProps) {
  const isGoogle = event.source === 'google';
  const color = event.color || (isGoogle ? '#9ca3af' : '#9ca3af');

  if (event.isAllDay) {
    // All-day event: colored pill bar
    return (
      <div
        className="gcal-allday-pill"
        style={{ backgroundColor: isGoogle ? '#9ca3af' : color }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(event);
        }}
      >
        <span className="gcal-allday-pill-text">{event.title}</span>
      </div>
    );
  }

  // Timed event: dot + Japanese time + title
  const timeLabel = event.startTime ? formatTimeJa(event.startTime) : '';

  return (
    <div
      className="gcal-event-chip"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(event);
      }}
    >
      {isGoogle ? (
        <span className="gcal-event-dot-outline" style={{ borderColor: '#9ca3af' }} />
      ) : (
        <span className="gcal-event-dot" style={{ backgroundColor: color }} />
      )}
      <span className="gcal-event-text">
        {timeLabel && <span className="gcal-event-time">{timeLabel} </span>}
        {event.title}
      </span>
    </div>
  );
}
