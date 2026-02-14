import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePopoverPosition } from '../../hooks/usePopoverPosition';

interface MiniCalendarProps {
  value: string;                          // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  showTime?: boolean;
  timeValue?: string;
  onTimeChange?: (time: string) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
}

interface CalendarDay {
  date: number;
  month: number; // 0-indexed
  year: number;
  isOtherMonth: boolean;
  dateStr: string; // YYYY-MM-DD
}

function buildCalendarDays(year: number, month: number): CalendarDay[] {
  const days: CalendarDay[] = [];
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay(); // 0=Sun

  // Previous month fill
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonthDays = new Date(prevYear, prevMonth + 1, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    days.push({
      date: d,
      month: prevMonth,
      year: prevYear,
      isOtherMonth: true,
      dateStr: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    });
  }

  // Current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      date: d,
      month,
      year,
      isOtherMonth: false,
      dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    });
  }

  // Next month fill (to complete 6 rows max)
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const remaining = 42 - days.length; // 6 rows
  for (let d = 1; d <= remaining; d++) {
    days.push({
      date: d,
      month: nextMonth,
      year: nextYear,
      isOtherMonth: true,
      dateStr: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    });
  }

  return days;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function MiniCalendar({
  value,
  onChange,
  showTime,
  timeValue,
  onTimeChange,
  anchorRef,
  open,
  onClose,
}: MiniCalendarProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // View date for navigation
  const [viewYear, setViewYear] = useState(() => {
    if (value) {
      const parts = value.split('-');
      return parseInt(parts[0], 10);
    }
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) {
      const parts = value.split('-');
      return parseInt(parts[1], 10) - 1;
    }
    return new Date().getMonth();
  });

  // Reset view when opened with a different value
  useEffect(() => {
    if (open && value) {
      const parts = value.split('-');
      setViewYear(parseInt(parts[0], 10));
      setViewMonth(parseInt(parts[1], 10) - 1);
    } else if (open && !value) {
      const now = new Date();
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    }
  }, [open, value]);

  const pos = usePopoverPosition(anchorRef, open, onClose);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    // Delay to avoid immediate close from the click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open, onClose, anchorRef]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const handlePrevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const handleDayClick = useCallback(
    (day: CalendarDay) => {
      onChange(day.dateStr);
      if (!showTime) {
        onClose();
      }
    },
    [onChange, onClose, showTime],
  );

  if (!open) return null;

  const todayStr = getTodayStr();
  const days = buildCalendarDays(viewYear, viewMonth);

  const popover = (
    <div
      ref={popoverRef}
      className="mini-cal-popover"
      style={{ top: pos.top, left: pos.left }}
    >
      {/* Header */}
      <div className="mini-cal-header">
        <button
          type="button"
          className="mini-cal-nav"
          onClick={handlePrevMonth}
          aria-label="前の月"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="mini-cal-title">
          {viewYear}年{viewMonth + 1}月
        </span>
        <button
          type="button"
          className="mini-cal-nav"
          onClick={handleNextMonth}
          aria-label="次の月"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>
      </div>

      {/* Weekday labels */}
      <div className="mini-cal-weekdays">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`mini-cal-weekday ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : ''}`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="mini-cal-grid">
        {days.map((day) => {
          const isSelected = day.dateStr === value;
          const isToday = day.dateStr === todayStr;
          const dow = new Date(day.year, day.month, day.date).getDay();

          let cls = 'mini-cal-day';
          if (day.isOtherMonth) cls += ' mini-cal-day-other';
          if (isSelected) cls += ' mini-cal-day-selected';
          else if (isToday) cls += ' mini-cal-day-today';
          if (!day.isOtherMonth && !isSelected) {
            if (dow === 0) cls += ' text-red-500';
            else if (dow === 6) cls += ' text-blue-500';
          }

          return (
            <button
              key={day.dateStr}
              type="button"
              className={cls}
              onClick={() => handleDayClick(day)}
            >
              {day.date}
            </button>
          );
        })}
      </div>

      {/* Time input */}
      {showTime && (
        <div className="mini-cal-time-row">
          <span className="text-xs text-gray-500 font-medium">時間</span>
          <input
            type="time"
            value={timeValue || ''}
            onChange={(e) => onTimeChange?.(e.target.value)}
            className="mini-cal-time-input"
          />
        </div>
      )}
    </div>
  );

  return createPortal(popover, document.body);
}
