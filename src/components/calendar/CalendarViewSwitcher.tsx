import { useState, useRef, useEffect } from 'react';

type CalendarMode = 'month' | 'week' | 'day';

interface CalendarViewSwitcherProps {
  mode: CalendarMode;
  onModeChange: (mode: CalendarMode) => void;
}

const MODE_OPTIONS: { value: CalendarMode; label: string; shortcut: string }[] = [
  { value: 'day', label: '日', shortcut: 'D' },
  { value: 'week', label: '週', shortcut: 'W' },
  { value: 'month', label: '月', shortcut: 'M' },
];

export default function CalendarViewSwitcher({ mode, onModeChange }: CalendarViewSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const currentLabel = MODE_OPTIONS.find((o) => o.value === mode)?.label ?? '月';

  return (
    <div ref={ref} className="gcal-view-switcher">
      <button
        onClick={() => setOpen((v) => !v)}
        className="gcal-view-switcher-trigger"
      >
        <span>{currentLabel}</span>
        <svg
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="gcal-view-switcher-menu">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`gcal-view-switcher-item ${mode === opt.value ? 'gcal-view-switcher-item-active' : ''}`}
              onClick={() => {
                onModeChange(opt.value);
                setOpen(false);
              }}
            >
              <span>{opt.label}</span>
              <span className="gcal-view-switcher-shortcut">{opt.shortcut}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
