import { useRef, useEffect } from 'react';
import type { CalendarEventDisplay } from '../../types/googleCalendar';
import { formatTimeJa } from '../../utils/calendarUtils';

interface CalendarDayPopoverProps {
  dateStr: string;
  events: CalendarEventDisplay[];
  anchorRect: DOMRect;
  onClose: () => void;
  onEventClick?: (event: CalendarEventDisplay) => void;
}

const WEEKDAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

export default function CalendarDayPopover({
  dateStr,
  events,
  anchorRect,
  onClose,
  onEventClick,
}: CalendarDayPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const d = new Date(dateStr + 'T00:00:00');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = WEEKDAY_NAMES[d.getDay()];

  // Position popover near the anchor cell
  const top = Math.min(anchorRect.bottom + 4, window.innerHeight - 540);
  const left = Math.min(anchorRect.left, window.innerWidth - 520);

  return (
    <div ref={ref} className="gcal-popover" style={{ top, left }}>
      <div className="gcal-popover-header">
        <div>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-gray-800)' }}>
            {month}月{day}日
          </span>
          <span className="ml-1 text-sm" style={{ color: 'var(--color-gray-400)' }}>
            ({weekday})
          </span>
        </div>
        <button className="gcal-popover-close" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="gcal-popover-body">
        {events.length === 0 ? (
          <p className="py-4 text-center text-sm" style={{ color: 'var(--color-gray-400)' }}>
            予定はありません
          </p>
        ) : (
          events.map((event) => {
            const isGoogle = event.source === 'google';
            const color = event.color || '#9ca3af';

            return (
              <div
                key={event.id}
                className="gcal-popover-entry"
                style={{ cursor: onEventClick ? 'pointer' : undefined }}
                onClick={() => onEventClick?.(event)}
              >
                {event.isAllDay ? (
                  <div
                    className="mt-0.5 rounded"
                    style={{
                      width: 8,
                      height: 8,
                      backgroundColor: isGoogle ? '#9ca3af' : color,
                      borderRadius: 2,
                      flexShrink: 0,
                    }}
                  />
                ) : isGoogle ? (
                  <span className="gcal-event-dot-outline mt-1" style={{ borderColor: '#9ca3af' }} />
                ) : (
                  <span className="gcal-event-dot mt-1" style={{ backgroundColor: color }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: 'var(--color-gray-800)' }}>
                    {event.title}
                  </div>
                  {event.startTime && (
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-gray-400)' }}>
                      {formatTimeJa(event.startTime)}
                      {event.endTime && ` - ${formatTimeJa(event.endTime)}`}
                    </div>
                  )}
                  {event.isAllDay && (
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-gray-400)' }}>
                      終日
                    </div>
                  )}
                </div>
                {event.source === 'google' && event.htmlLink && (
                  <a
                    href={event.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 text-xs"
                    style={{ color: 'var(--color-primary-600)' }}
                  >
                    開く
                  </a>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
