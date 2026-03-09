import { useState, useEffect, useMemo, useRef } from 'react';

function formatTimeLabel(hh24: number, mm: string): string {
  const period = hh24 < 12 ? '午前' : '午後';
  const h12 = hh24 === 0 ? 12 : hh24 > 12 ? hh24 - 12 : hh24;
  return `${period}${h12}:${mm}`;
}

export const TIME_SLOTS: { value: string; label: string }[] = (() => {
  const slots: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of ['00', '15', '30', '45']) {
      const value = `${String(h).padStart(2, '0')}:${m}`;
      slots.push({ value, label: formatTimeLabel(h, m) });
    }
  }
  return slots;
})();

export default function TimeDropdown({
  timeValue,
  onTimeChange,
  label,
}: {
  timeValue?: string;
  onTimeChange?: (time: string) => void;
  label?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const displayLabel = useMemo(() => {
    if (!timeValue) return '--:--';
    const slot = TIME_SLOTS.find((s) => s.value === timeValue);
    if (slot) return slot.label;
    // Snap to nearest quarter for display
    const [hh, mm] = timeValue.split(':');
    const h = parseInt(hh, 10);
    const rounded = Math.round(parseInt(mm, 10) / 15) * 15;
    const finalM = rounded === 60 ? '00' : String(rounded).padStart(2, '0');
    return formatTimeLabel(h, finalM);
  }, [timeValue]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen]);

  // Auto-scroll on open
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    let targetValue = timeValue;
    if (!targetValue) {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(Math.floor(now.getMinutes() / 15) * 15).padStart(2, '0');
      targetValue = `${h}:${m}`;
    }
    const el = listRef.current.querySelector(`[data-value="${targetValue}"]`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ block: 'center' });
    }
  }, [isOpen, timeValue]);

  const handleSelect = (value: string) => {
    onTimeChange?.(value);
    setIsOpen(false);
  };

  return (
    <div className={label ? '' : 'mini-cal-time-row'} style={label ? { position: 'relative', flex: 1 } : undefined}>
      {!label && <span className="text-xs text-gray-500 font-medium">時間</span>}
      <div ref={containerRef} style={{ position: 'relative', flex: label ? undefined : 1 }}>
        <button
          type="button"
          className="mini-cal-time-trigger"
          onClick={() => setIsOpen((v) => !v)}
        >
          {displayLabel}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {isOpen && (
          <div ref={listRef} className="mini-cal-time-list">
            {TIME_SLOTS.map((slot) => (
              <div
                key={slot.value}
                data-value={slot.value}
                className={`mini-cal-time-option${slot.value === timeValue ? ' mini-cal-time-option-selected' : ''}`}
                onClick={() => handleSelect(slot.value)}
              >
                {slot.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
