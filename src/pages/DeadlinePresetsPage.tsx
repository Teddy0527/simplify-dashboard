import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { INDUSTRY_OPTIONS, DEADLINE_TYPE_LABELS, DeadlineType, DeadlinePresetWithCompany } from '@simplify/shared';
import { useDeadlinePresets } from '../hooks/useDeadlinePresets';

// ── Constants ───────────────────────────────────────────────────────────

const FIXED_YEAR = 2028;

const GCAL_TYPE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  es_submission:  { bg: '#039BE5', text: '#ffffff', border: '#028ACE', dot: '#039BE5' },
  document:       { bg: '#039BE5', text: '#ffffff', border: '#028ACE', dot: '#039BE5' },
  webtest:        { bg: '#E67C73', text: '#ffffff', border: '#D56B63', dot: '#E67C73' },
  interview:      { bg: '#E67C73', text: '#ffffff', border: '#D56B63', dot: '#E67C73' },
  internship:     { bg: '#0B8043', text: '#ffffff', border: '#097339', dot: '#0B8043' },
  event:          { bg: '#33B679', text: '#ffffff', border: '#2AA56C', dot: '#33B679' },
  offer_response: { bg: '#616161', text: '#ffffff', border: '#515151', dot: '#616161' },
  other:          { bg: '#616161', text: '#ffffff', border: '#515151', dot: '#616161' },
};

const VISUAL_CATEGORIES: Array<{ label: string; color: string }> = [
  { label: 'ES・書類',   color: '#039BE5' },
  { label: '選考',       color: '#E67C73' },
  { label: 'インターン', color: '#0B8043' },
  { label: '説明会',     color: '#33B679' },
  { label: 'その他',     color: '#616161' },
];

function getTypeColor(type: string) {
  return GCAL_TYPE_COLORS[type] || GCAL_TYPE_COLORS.other;
}

const MAX_VISIBLE_EVENTS = 3;

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

// ── Helpers ─────────────────────────────────────────────────────────────

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevDays = new Date(year, month, 0).getDate();
  const cells: Array<{ date: Date; currentMonth: boolean }> = [];

  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, prevDays - i), currentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), currentMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), currentMonth: false });
  }
  return cells;
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ── Main Page ───────────────────────────────────────────────────────────

export default function DeadlinePresetsPage() {
  const [query, setQuery] = useState('');
  const [industry, setIndustry] = useState('');

  const { byDate, loading } = useDeadlinePresets(query, FIXED_YEAR, industry || undefined);

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="mb-5 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900">ES締切データベース</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-700">
              28卒
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">主要企業のES締切・選考スケジュールを一覧で確認できます</p>
        </div>
        <InlineLegend />
      </div>

      {/* Filters */}
      <DeadlineFilters
        query={query}
        onQueryChange={setQuery}
        industry={industry}
        onIndustryChange={setIndustry}
      />

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin mb-2" />
          <p className="text-sm">読み込み中...</p>
        </div>
      ) : (
        <CalendarView byDate={byDate} />
      )}
    </div>
  );
}

// ── InlineLegend ────────────────────────────────────────────────────────

function InlineLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {VISUAL_CATEGORIES.map((cat) => (
        <div key={cat.label} className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: cat.color }}
          />
          <span className="text-xs text-gray-500 font-medium">{cat.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── DeadlineFilters ─────────────────────────────────────────────────────

function DeadlineFilters({
  query, onQueryChange, industry, onIndustryChange,
}: {
  query: string; onQueryChange: (v: string) => void;
  industry: string; onIndustryChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 mb-5">
      <div className="flex-1 min-w-[200px] relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="input-field !py-2 !pl-9"
          placeholder="企業名で検索..."
        />
      </div>
      <select
        value={industry}
        onChange={(e) => onIndustryChange(e.target.value)}
        className="select-field w-auto !py-2"
      >
        <option value="">全業界</option>
        {INDUSTRY_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

// ── CalendarView ────────────────────────────────────────────────────────

function CalendarView({ byDate }: { byDate: Map<string, DeadlinePresetWithCompany[]> }) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [popover, setPopover] = useState<{ date: Date; entries: DeadlinePresetWithCompany[]; x: number; y: number } | null>(null);
  const [eventDetail, setEventDetail] = useState<{ entry: DeadlinePresetWithCompany; x: number; y: number } | null>(null);

  const prevMonth = useCallback(() => {
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);

  const goToday = useCallback(() => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  }, []);

  const handleDayPopover = useCallback((date: Date, entries: DeadlinePresetWithCompany[], e: React.MouseEvent) => {
    setEventDetail(null);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.min(rect.left, window.innerWidth - 370);
    const y = Math.min(rect.bottom + 4, window.innerHeight - 410);
    setPopover({ date, entries, x: Math.max(8, x), y: Math.max(8, y) });
  }, []);

  const handleEventDetail = useCallback((entry: DeadlinePresetWithCompany, e: React.MouseEvent) => {
    setPopover(null);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.min(rect.right + 4, window.innerWidth - 300);
    const y = Math.min(rect.top, window.innerHeight - 300);
    setEventDetail({ entry, x: Math.max(8, x), y: Math.max(8, y) });
  }, []);

  return (
    <div className="gcal-container">
      <CalendarNavHeader
        currentDate={currentDate}
        onPrev={prevMonth}
        onNext={nextMonth}
        onToday={goToday}
      />
      <WeekdayHeaders />
      <MonthGrid
        currentDate={currentDate}
        byDate={byDate}
        today={today}
        onShowDayPopover={handleDayPopover}
        onShowEventDetail={handleEventDetail}
      />

      {popover && (
        <DayDetailPopover
          date={popover.date}
          entries={popover.entries}
          x={popover.x}
          y={popover.y}
          onClose={() => setPopover(null)}
        />
      )}
      {eventDetail && (
        <EventDetailPopover
          entry={eventDetail.entry}
          x={eventDetail.x}
          y={eventDetail.y}
          onClose={() => setEventDetail(null)}
        />
      )}
    </div>
  );
}

// ── CalendarNavHeader ───────────────────────────────────────────────────

function CalendarNavHeader({
  currentDate, onPrev, onNext, onToday,
}: {
  currentDate: Date; onPrev: () => void; onNext: () => void; onToday: () => void;
}) {
  const title = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--gcal-grid-border)]">
      <button
        onClick={onToday}
        className="px-3.5 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        今日
      </button>
      <button
        onClick={onPrev}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        onClick={onNext}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 6 15 12 9 18" />
        </svg>
      </button>
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
    </div>
  );
}

// ── WeekdayHeaders ──────────────────────────────────────────────────────

function WeekdayHeaders() {
  return (
    <div className="grid grid-cols-7 border-b border-[var(--gcal-grid-border)]">
      {WEEKDAY_LABELS.map((label, i) => (
        <div
          key={label}
          className={`text-center text-xs font-medium py-2 ${
            i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

// ── MonthGrid ───────────────────────────────────────────────────────────

function MonthGrid({
  currentDate, byDate, today, onShowDayPopover, onShowEventDetail,
}: {
  currentDate: Date;
  byDate: Map<string, DeadlinePresetWithCompany[]>;
  today: Date;
  onShowDayPopover: (date: Date, entries: DeadlinePresetWithCompany[], e: React.MouseEvent) => void;
  onShowEventDetail: (entry: DeadlinePresetWithCompany, e: React.MouseEvent) => void;
}) {
  const cells = useMemo(
    () => getMonthDays(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate]
  );

  return (
    <div className="gcal-grid">
      {cells.map((cell, idx) => {
        const key = formatDateKey(cell.date);
        const entries = byDate.get(key) || [];
        const dow = cell.date.getDay();
        const isToday = isSameDay(cell.date, today);
        const isWeekend = dow === 0 || dow === 6;

        let cellClass = 'gcal-cell';
        if (!cell.currentMonth) cellClass += ' gcal-cell-other-month';
        else if (isToday) cellClass += ' gcal-cell-today';
        else if (isWeekend) cellClass += ' gcal-cell-weekend';

        return (
          <div key={idx} className={cellClass}>
            <DayNumber date={cell.date} isToday={isToday} dow={dow} />
            <div className="space-y-px">
              {entries.slice(0, MAX_VISIBLE_EVENTS).map((entry) => (
                <EventChip
                  key={entry.id}
                  entry={entry}
                  onClick={(e) => onShowEventDetail(entry, e)}
                />
              ))}
              {entries.length > MAX_VISIBLE_EVENTS && (
                <button
                  className="text-[11px] text-gray-500 hover:text-gray-700 font-medium pl-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowDayPopover(cell.date, entries, e);
                  }}
                >
                  +{entries.length - MAX_VISIBLE_EVENTS}件
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── DayNumber ───────────────────────────────────────────────────────────

function DayNumber({ date, isToday, dow }: { date: Date; isToday: boolean; dow: number }) {
  let className = 'gcal-day-number';
  if (isToday) className += ' gcal-day-number-today';
  else if (dow === 0) className += ' gcal-day-number-sunday';
  else if (dow === 6) className += ' gcal-day-number-saturday';

  return <div className={className}>{date.getDate()}</div>;
}

// ── EventChip ───────────────────────────────────────────────────────────

function EventChip({ entry, onClick }: { entry: DeadlinePresetWithCompany; onClick?: (e: React.MouseEvent) => void }) {
  const color = getTypeColor(entry.deadlineType);
  const companyShort = entry.companyName.length > 8
    ? entry.companyName.slice(0, 8) + '…'
    : entry.companyName;
  const categoryLabel = DEADLINE_TYPE_LABELS[entry.deadlineType as DeadlineType] || entry.deadlineType;
  const tooltip = `${entry.companyName} · ${categoryLabel} · ${entry.label}`;

  return (
    <button
      className="gcal-event-chip"
      style={{
        borderLeftColor: color.bg,
        backgroundColor: `${color.bg}15`,
        color: color.border,
      }}
      title={tooltip}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      <span className="gcal-event-chip-dot" style={{ backgroundColor: color.dot }} />
      <span className="truncate">{companyShort}</span>
    </button>
  );
}

// ── DayDetailPopover ────────────────────────────────────────────────────

function DayDetailPopover({
  date, entries, x, y, onClose,
}: {
  date: Date;
  entries: DeadlinePresetWithCompany[];
  x: number;
  y: number;
  onClose: () => void;
}) {
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

  const dateLabel = `${date.getMonth() + 1}月${date.getDate()}日（${WEEKDAY_LABELS[date.getDay()]}）`;

  return (
    <div ref={ref} className="gcal-popover" style={{ left: x, top: y }}>
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">{dateLabel}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-0.5">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="p-3 space-y-2">
        {entries.map((entry) => {
          const color = getTypeColor(entry.deadlineType);
          return (
            <div key={entry.id} className="flex items-start gap-2.5 text-sm">
              <span
                className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                style={{ backgroundColor: color.dot }}
              />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 truncate">{entry.companyName}</div>
                <div className="text-xs text-gray-600 truncate">
                  {DEADLINE_TYPE_LABELS[entry.deadlineType as DeadlineType] || entry.deadlineType}
                  {' · '}
                  {entry.label}
                </div>
                {(entry.deadlineTime || entry.memo) && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    {entry.deadlineTime && <span>{entry.deadlineTime}</span>}
                    {entry.deadlineTime && entry.memo && <span> · </span>}
                    {entry.memo && <span>{entry.memo}</span>}
                  </div>
                )}
                {entry.sourceUrl && (
                  <a
                    href={entry.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ソースを確認
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── EventDetailPopover ─────────────────────────────────────────────────

function EventDetailPopover({
  entry, x, y, onClose,
}: {
  entry: DeadlinePresetWithCompany;
  x: number;
  y: number;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const color = getTypeColor(entry.deadlineType);
  const categoryLabel = DEADLINE_TYPE_LABELS[entry.deadlineType as DeadlineType] || entry.deadlineType;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    if (rect.right > window.innerWidth - 8) {
      el.style.left = `${Math.max(8, window.innerWidth - rect.width - 8)}px`;
    }
    if (rect.bottom > window.innerHeight - 8) {
      el.style.top = `${Math.max(8, window.innerHeight - rect.height - 8)}px`;
    }
  }, []);

  const deadlineDate = new Date(entry.deadlineDate + 'T00:00:00');
  const dateLabel = `${deadlineDate.getMonth() + 1}月${deadlineDate.getDate()}日（${WEEKDAY_LABELS[deadlineDate.getDay()]}）${entry.deadlineTime || ''}`;

  const logoUrl = entry.companyWebsiteDomain
    ? `https://logo.clearbit.com/${entry.companyWebsiteDomain}`
    : undefined;

  return (
    <div ref={ref} className="gcal-popover" style={{ left: x, top: y }}>
      {/* Color strip */}
      <div className="h-2 rounded-t-xl" style={{ backgroundColor: color.bg }} />

      {/* Close button */}
      <div className="flex justify-end px-4 pt-2">
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-0.5">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="px-4 pb-4">
        {/* Company name with logo */}
        <div className="flex items-center gap-2.5 mb-0.5">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="w-8 h-8 rounded-md object-contain bg-white border border-gray-100 flex-shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-medium flex-shrink-0">
              {entry.companyName.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-base font-medium text-gray-900 truncate">{entry.companyName}</div>
            {entry.companyIndustry && (
              <div className="text-xs text-gray-500">{entry.companyIndustry}</div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mt-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-base">📅</span>
            <span>{dateLabel}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-base">🏷️</span>
            <span>{categoryLabel} · {entry.label}</span>
          </div>

          {entry.memo && (
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-base">📝</span>
              <span>{entry.memo}</span>
            </div>
          )}

          {entry.sourceUrl && (
            <div className="flex items-center gap-2">
              <span className="text-base">🔗</span>
              <a
                href={entry.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
              >
                ソースを確認
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          )}

          {entry.contributorCount > 0 && (
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-base">👥</span>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                {entry.contributorCount}人が報告
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
