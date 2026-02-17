import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { INDUSTRY_OPTIONS, DEADLINE_TYPE_LABELS, DeadlineType, DeadlinePresetWithCompany, createCompany, createDeadline, mapMasterIndustry, trackEventAsync, trackEventDebounced, trackMilestoneOnce } from '@jobsimplify/shared';
import { useDeadlinePresets, CompanyGroup } from '../hooks/useDeadlinePresets';
import { useCompanies } from '../hooks/useCompanies';
import { useToast } from '../hooks/useToast';
import { useOnboardingContext } from '../contexts/OnboardingContext';
import { getDeadlineUrgency, formatDeadlineShort } from '../utils/deadlineHelpers';
import { buildPresetGoogleCalendarUrl } from '../utils/googleCalendar';
import { ReminderButton } from '../components/ReminderButton';

// ── Constants ───────────────────────────────────────────────────────────

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

const URGENCY_COLORS: Record<string, string> = {
  overdue: 'bg-red-100 text-red-700 border-red-200',
  urgent: 'bg-red-50 text-red-600 border-red-200',
  soon: 'bg-amber-50 text-amber-700 border-amber-200',
  normal: 'bg-gray-50 text-gray-700 border-gray-200',
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  es_submission: 'bg-blue-100 text-blue-700',
  internship: 'bg-green-100 text-green-700',
  webtest: 'bg-purple-100 text-purple-700',
  interview: 'bg-orange-100 text-orange-700',
  offer_response: 'bg-pink-100 text-pink-700',
  document: 'bg-gray-100 text-gray-700',
  event: 'bg-teal-100 text-teal-700',
  other: 'bg-gray-100 text-gray-600',
};

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

// ── Helpers ─────────────────────────────────────────────────────────────

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Previous month fill
  const prevDays = new Date(year, month, 0).getDate();
  const cells: Array<{ date: Date; currentMonth: boolean }> = [];

  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, prevDays - i), currentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), currentMonth: true });
  }
  // Next month fill to complete current week row only (4-6 rows dynamic)
  const remaining = (7 - (cells.length % 7)) % 7;
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

function getWeekDays(date: Date): Date[] {
  const d = new Date(date);
  const dow = d.getDay(); // 0=Sun
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - dow);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + i);
    days.push(day);
  }
  return days;
}

function getWeekRangeLabel(days: Date[]): string {
  const first = days[0];
  const last = days[6];
  if (first.getFullYear() !== last.getFullYear()) {
    return `${first.getFullYear()}年${first.getMonth() + 1}月 - ${last.getFullYear()}年${last.getMonth() + 1}月`;
  }
  if (first.getMonth() !== last.getMonth()) {
    return `${first.getFullYear()}年${first.getMonth() + 1}月 - ${last.getMonth() + 1}月`;
  }
  return `${first.getFullYear()}年${first.getMonth() + 1}月`;
}

// ── DetailRow helper ────────────────────────────────────────────────────

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="text-gray-400 flex-shrink-0 w-20">{label}</span>
      <span className="text-gray-700 min-w-0">{children}</span>
    </div>
  );
}

// ── GCalButton helper ────────────────────────────────────────────────────

function GCalButton({ entry, size = 'sm' }: { entry: DeadlinePresetWithCompany; size?: 'sm' | 'xs' }) {
  const url = buildPresetGoogleCalendarUrl(entry);
  const iconSize = size === 'xs' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-400 hover:text-green-600 transition-colors flex-shrink-0"
      title="Googleカレンダーに追加"
      onClick={(e) => {
        e.stopPropagation();
        trackEventAsync('deadline.gcal_add', { companyMasterId: entry.companyMasterId, deadlineType: entry.deadlineType });
      }}
    >
      <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="12" y1="14" x2="12" y2="18" />
        <line x1="10" y1="16" x2="14" y2="16" />
      </svg>
    </a>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────

export default function DeadlinePresetsPage() {
  const [query, setQuery] = useState('');
  const [industry, setIndustry] = useState('');
  const [viewMode, setViewMode] = useState<'calendar' | 'week' | 'list'>('calendar');

  const navigate = useNavigate();
  const { completeChecklistItem } = useOnboardingContext();

  // Complete checklist item after 3 seconds on this page
  useEffect(() => {
    const timer = setTimeout(() => completeChecklistItem('check_deadlines'), 3000);
    return () => clearTimeout(timer);
  }, [completeChecklistItem]);
  const { grouped, byDate, loading } = useDeadlinePresets(query, 2028, industry || undefined);
  const { companies, addCompany } = useCompanies();
  const { showToast } = useToast();

  const trackedMasterIds = useMemo(
    () => new Set(companies.filter(c => c.companyMasterId).map(c => c.companyMasterId!)),
    [companies],
  );

  const handleAddToTracker = useCallback(async (group: CompanyGroup) => {
    if (trackedMasterIds.has(group.companyMasterId)) {
      showToast('すでにTrackerに追加済みです', 'error');
      return;
    }
    const company = createCompany(group.companyName);
    company.companyMasterId = group.companyMasterId;
    company.websiteDomain = group.companyWebsiteDomain;
    if (group.companyIndustry) {
      company.industry = mapMasterIndustry(group.companyIndustry) || group.companyIndustry;
    }
    company.deadlines = group.deadlines.map(d =>
      createDeadline(d.deadlineType, d.label, d.deadlineDate, d.deadlineTime, d.memo),
    );
    await addCompany(company);
    trackEventAsync('deadline.add_to_tracker', {
      companyMasterId: group.companyMasterId,
      deadlineCount: group.deadlines.length,
    });
    trackMilestoneOnce('milestone.first_deadline_add');
    navigate('/?company=' + company.id);
  }, [trackedMasterIds, addCompany, navigate, showToast]);

  const handleAddEntryToTracker = useCallback((entry: DeadlinePresetWithCompany) => {
    const group = grouped.find(g => g.companyMasterId === entry.companyMasterId);
    if (group) {
      handleAddToTracker(group);
    } else {
      // Fallback: create a group from the single entry
      handleAddToTracker({
        companyMasterId: entry.companyMasterId,
        companyName: entry.companyName,
        companyIndustry: entry.companyIndustry,
        companyWebsiteDomain: entry.companyWebsiteDomain,
        deadlines: [entry],
      });
    }
  }, [grouped, handleAddToTracker]);

  const isCalendarView = viewMode === 'calendar' && !loading;

  return (
    <div className={`flex-1 ${isCalendarView ? 'px-4 pt-3 pb-3 overflow-hidden flex flex-col' : 'px-6 pt-6 pb-8 overflow-y-auto'}`}>
      {/* Header */}
      <div className={`${isCalendarView ? 'mb-3' : 'mb-6'} flex items-end justify-between flex-wrap gap-3`}>
        <div>
          <h1 className={`${isCalendarView ? 'text-lg' : 'text-xl'} font-semibold tracking-tight text-gray-900`}>ES締切データベース</h1>
          {!isCalendarView && <p className="text-sm text-gray-500 mt-1.5">主要企業のES締切・選考スケジュールを一覧で確認できます</p>}
        </div>
        <ViewToggle viewMode={viewMode} onChange={(v) => {
          trackEventAsync('interaction.view_mode_change', { from: viewMode, to: v, page: 'deadlines' });
          setViewMode(v);
        }} compact={isCalendarView} />
      </div>

      {/* Filters */}
      <DeadlineFilters
        query={query}
        onQueryChange={(q) => {
          setQuery(q);
          if (q) trackEventDebounced('deadline.search', { query: q.slice(0, 50) });
        }}
        industry={industry}
        onIndustryChange={(v) => {
          setIndustry(v);
          if (v) trackEventAsync('interaction.filter_use', { type: 'industry', value: v, page: 'deadlines' });
        }}
        compact={isCalendarView}
      />

      {/* Content */}
      <div className={isCalendarView ? 'flex-1 min-h-0' : ''}>
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin mb-2" />
            <p className="text-sm">読み込み中...</p>
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarLayout byDate={byDate} trackedMasterIds={trackedMasterIds} onAddEntryToTracker={handleAddEntryToTracker} />
        ) : viewMode === 'week' ? (
          <WeekLayout byDate={byDate} trackedMasterIds={trackedMasterIds} onAddEntryToTracker={handleAddEntryToTracker} />
        ) : (
          <ListView grouped={grouped} query={query} trackedMasterIds={trackedMasterIds} onAddToTracker={handleAddToTracker} />
        )}
      </div>
    </div>
  );
}

// ── ViewToggle ──────────────────────────────────────────────────────────

function ViewToggle({ viewMode, onChange, compact = false }: {
  viewMode: 'calendar' | 'week' | 'list';
  onChange: (v: 'calendar' | 'week' | 'list') => void;
  compact?: boolean;
}) {
  const options: Array<{ key: 'calendar' | 'week' | 'list'; label: string; icon: React.ReactNode }> = [
    {
      key: 'calendar',
      label: '月',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      key: 'week',
      label: '週',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="10" y1="4" x2="10" y2="22" />
        </svg>
      ),
    },
    {
      key: 'list',
      label: 'リスト',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
    },
  ];

  return (
    <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
      {options.map((opt, i) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`${compact ? 'px-2.5 py-1.5 text-sm gap-1' : 'px-3 py-1.5 text-sm gap-1.5'} font-medium transition-colors flex items-center ${
            i > 0 ? 'border-l border-gray-200' : ''
          } ${viewMode === opt.key ? 'bg-primary-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── DeadlineFilters ─────────────────────────────────────────────────────

function DeadlineFilters({
  query, onQueryChange, industry, onIndustryChange, compact = false,
}: {
  query: string; onQueryChange: (v: string) => void;
  industry: string; onIndustryChange: (v: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? 'mb-3' : 'mb-6'}`}>
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className={`input-field ${compact ? '!py-1.5 text-sm' : '!py-2'}`}
          placeholder="企業名で検索..."
        />
      </div>
      <select
        value={industry}
        onChange={(e) => onIndustryChange(e.target.value)}
        className={`select-field w-auto ${compact ? '!py-1.5 text-sm min-w-[132px]' : '!py-2'}`}
      >
        <option value="">全業界</option>
        {INDUSTRY_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

// ── CalendarLayout ──────────────────────────────────────────────────────

function CalendarLayout({ byDate, trackedMasterIds, onAddEntryToTracker }: {
  byDate: Map<string, DeadlinePresetWithCompany[]>;
  trackedMasterIds: Set<string>;
  onAddEntryToTracker: (entry: DeadlinePresetWithCompany) => void;
}) {
  const CALENDAR_WEEKDAY_HEADER_HEIGHT = 28;
  const CALENDAR_SCALE = 0.92;
  const calendarAreaRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [popover, setPopover] = useState<{ date: Date; entries: DeadlinePresetWithCompany[]; x: number; y: number } | null>(null);
  const [eventDetail, setEventDetail] = useState<{ entry: DeadlinePresetWithCompany; x: number; y: number } | null>(null);
  const [rowHeight, setRowHeight] = useState(0);
  const rowCount = useMemo(
    () => getMonthDays(currentDate.getFullYear(), currentDate.getMonth()).length / 7,
    [currentDate]
  );

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
    const y = Math.min(rect.top, window.innerHeight - 250);
    setEventDetail({ entry, x: Math.max(8, x), y: Math.max(8, y) });
  }, []);

  useEffect(() => {
    const area = calendarAreaRef.current;
    if (!area) return;
    const observer = new ResizeObserver((entries) => {
      const { height } = entries[0].contentRect;
      const availableHeight = Math.max(height - CALENDAR_WEEKDAY_HEADER_HEIGHT, 0);
      const heightPerRow = Math.floor((availableHeight * CALENDAR_SCALE) / rowCount);
      setRowHeight(Math.max(heightPerRow, 0));
    });
    observer.observe(area);
    return () => observer.disconnect();
  }, [rowCount]);

  return (
    <div className="h-full flex flex-col min-h-0">
      <CalendarNavHeader
        currentDate={currentDate}
        onPrev={prevMonth}
        onNext={nextMonth}
        onToday={goToday}
        compact
      />
      <div ref={calendarAreaRef} className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full w-full max-w-[1400px] mx-auto">
          <WeekdayHeaders />
          <MonthGrid
            currentDate={currentDate}
            byDate={byDate}
            today={today}
            rowHeight={rowHeight}
            onShowDayPopover={handleDayPopover}
            onShowEventDetail={handleEventDetail}
          />
        </div>
      </div>

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
          isAlreadyTracked={trackedMasterIds.has(eventDetail.entry.companyMasterId)}
          onAddToTracker={() => onAddEntryToTracker(eventDetail.entry)}
        />
      )}
    </div>
  );
}

// ── CalendarNavHeader ───────────────────────────────────────────────────

function CalendarNavHeader({
  currentDate, onPrev, onNext, onToday, compact = false,
}: {
  currentDate: Date; onPrev: () => void; onNext: () => void; onToday: () => void; compact?: boolean;
}) {
  const title = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
  return (
    <div className={`flex items-center justify-between ${compact ? 'mb-2' : 'mb-3'}`}>
      <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'}`}>
        <button
          onClick={onToday}
          className={`${compact ? 'px-2.5 py-1 text-sm' : 'px-3 py-1.5 text-sm'} font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors`}
        >
          今日
        </button>
        <button
          onClick={onPrev}
          className={`${compact ? 'w-7 h-7' : 'w-8 h-8'} flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          onClick={onNext}
          className={`${compact ? 'w-7 h-7' : 'w-8 h-8'} flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>
        <h2 className={`${compact ? 'text-lg' : 'text-lg'} font-medium text-gray-900`}>{title}</h2>
      </div>
      <DeadlineTypeLegend />
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
          className={`text-center text-sm font-medium py-1.5 ${
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
  currentDate, byDate, today, rowHeight, onShowDayPopover, onShowEventDetail,
}: {
  currentDate: Date;
  byDate: Map<string, DeadlinePresetWithCompany[]>;
  today: Date;
  rowHeight: number;
  onShowDayPopover: (date: Date, entries: DeadlinePresetWithCompany[], e: React.MouseEvent) => void;
  onShowEventDetail: (entry: DeadlinePresetWithCompany, e: React.MouseEvent) => void;
}) {
  const cells = useMemo(
    () => getMonthDays(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate]
  );

  const gridStyle = rowHeight > 0 ? { gridAutoRows: `${rowHeight}px` } : undefined;
  // Fit as many rows as possible in each day cell while leaving room for the date header.
  const maxRowsPerCell = rowHeight > 0
    ? Math.max(1, Math.min(8, Math.floor((rowHeight - 40) / 36)))
    : 1;

  return (
    <div className="gcal-grid gcal-grid-tight w-full" style={gridStyle}>
      {cells.map((cell, idx) => {
        const key = formatDateKey(cell.date);
        const entries = byDate.get(key) || [];
        const dow = cell.date.getDay();
        const isToday = isSameDay(cell.date, today);
        const isWeekend = dow === 0 || dow === 6;

        let cellClass = 'gcal-cell gcal-cell-no-click';
        if (!cell.currentMonth) cellClass += ' gcal-cell-other-month';
        else if (isToday) cellClass += ' gcal-cell-today';
        else if (isWeekend) cellClass += ' gcal-cell-weekend';

        return (
          <div key={idx} className={cellClass}>
            <DayNumber date={cell.date} isToday={isToday} dow={dow} />
            <div className="space-y-px">
              {entries.slice(0, entries.length > maxRowsPerCell ? maxRowsPerCell - 1 : maxRowsPerCell).map((entry) => (
                <EventChip
                  key={entry.id}
                  entry={entry}
                  onClick={(e) => onShowEventDetail(entry, e)}
                />
              ))}
              {entries.length > maxRowsPerCell && (
                <button
                  className="text-[11px] text-gray-500 hover:text-gray-700 font-medium pl-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowDayPopover(cell.date, entries, e);
                  }}
                >
                  +{entries.length - (maxRowsPerCell - 1)}件
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
  const categoryLabel = DEADLINE_TYPE_LABELS[entry.deadlineType as DeadlineType] || entry.deadlineType;
  const tooltip = `${entry.companyName} · ${categoryLabel} · ${entry.label}`;

  return (
    <div
      className="gcal-event-chip w-full text-left"
      title={tooltip}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      <span className="gcal-event-dot" style={{ backgroundColor: color.dot }} />
      <span className="gcal-event-text">{entry.companyName}</span>
    </div>
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
      <div className="gcal-popover-header">
        <h3 className="text-sm font-semibold text-gray-900">{dateLabel}</h3>
        <button onClick={onClose} className="gcal-popover-close">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="gcal-popover-body">
        {entries.map((entry) => {
          const color = getTypeColor(entry.deadlineType);
          return (
            <div key={entry.id} className="gcal-popover-entry">
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
              </div>
              <GCalButton entry={entry} size="xs" />
              <ReminderButton entry={entry} size="xs" />
              {entry.sourceUrl && (
                <a
                  href={entry.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary-600 transition-colors flex-shrink-0"
                  title="ソースを開く"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── EventDetailPopover ─────────────────────────────────────────────────

function EventDetailPopover({
  entry, x, y, onClose, isAlreadyTracked, onAddToTracker,
}: {
  entry: DeadlinePresetWithCompany;
  x: number;
  y: number;
  onClose: () => void;
  isAlreadyTracked?: boolean;
  onAddToTracker?: () => void;
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

  // Adjust position to stay within viewport
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
  const dateLabel = `${deadlineDate.getMonth() + 1}月${deadlineDate.getDate()}日（${WEEKDAY_LABELS[deadlineDate.getDay()]}）${entry.deadlineTime ? ' ' + entry.deadlineTime : ''}`;

  return (
    <div ref={ref} className="gcal-popover overflow-hidden" style={{ left: x, top: y }}>
      {/* Accent bar */}
      <div className="h-1.5" style={{ backgroundColor: color.bg }} />
      <div className="gcal-popover-header" style={{ borderBottom: 'none', paddingBottom: 4 }}>
        <div className="flex-1 min-w-0" />
        <button onClick={onClose} className="gcal-popover-close">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="px-4 pb-4">
        {/* Company name with color dot */}
        <div className="flex items-center gap-2.5 mb-1">
          <span
            className="w-3 h-3 rounded flex-shrink-0"
            style={{ backgroundColor: color.dot }}
          />
          <span className="text-base font-medium text-gray-900 truncate">{entry.companyName}</span>
        </div>
        {/* Date */}
        <div className="text-sm text-gray-500 ml-[22px] mb-4">{dateLabel}</div>
        {/* Details */}
        <div className="space-y-2 ml-[22px]">
          <DetailRow label="カテゴリ">{categoryLabel}</DetailRow>
          <DetailRow label="ラベル">{entry.label}</DetailRow>
          {entry.memo && <DetailRow label="メモ">{entry.memo}</DetailRow>}
          {entry.contributorCount > 0 && (
            <div className="pt-1">
              <span className="text-xs text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded">
                {entry.contributorCount}人が報告
              </span>
            </div>
          )}
          {/* Source URL + GCal + Tracker button */}
          <div className="flex items-center gap-3 pt-3 mt-2 border-t border-gray-100">
            {entry.sourceUrl && (
              <a
                href={entry.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                ソースを開く
              </a>
            )}
            {entry.sourceUrl && <span className="text-gray-200">|</span>}
            <GCalButton entry={entry} size="sm" />
            <ReminderButton entry={entry} size="sm" dropUp />
            {onAddToTracker && <span className="text-gray-200">|</span>}
            {onAddToTracker && (
                isAlreadyTracked ? (
                  <span className="text-sm text-gray-400 flex items-center gap-1.5">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    追加済み
                  </span>
                ) : (
                  <button
                    onClick={onAddToTracker}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    + Trackerに追加
                  </button>
                )
              )}
            </div>
        </div>
      </div>
    </div>
  );
}

// ── DeadlineTypeLegend ──────────────────────────────────────────────────

function DeadlineTypeLegend() {
  return (
    <div className="hidden md:flex items-center gap-3">
      {VISUAL_CATEGORIES.map((cat) => (
        <div key={cat.label} className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: cat.color }}
          />
          <span className="text-sm text-gray-500">{cat.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── WeekLayout ──────────────────────────────────────────────────────────

function WeekLayout({ byDate, trackedMasterIds, onAddEntryToTracker }: {
  byDate: Map<string, DeadlinePresetWithCompany[]>;
  trackedMasterIds: Set<string>;
  onAddEntryToTracker: (entry: DeadlinePresetWithCompany) => void;
}) {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay());
    return d;
  });
  const [eventDetail, setEventDetail] = useState<{ entry: DeadlinePresetWithCompany; x: number; y: number } | null>(null);

  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const rangeLabel = useMemo(() => getWeekRangeLabel(days), [days]);

  const prevWeek = useCallback(() => {
    setWeekStart(d => {
      const next = new Date(d);
      next.setDate(d.getDate() - 7);
      return next;
    });
  }, []);

  const nextWeek = useCallback(() => {
    setWeekStart(d => {
      const next = new Date(d);
      next.setDate(d.getDate() + 7);
      return next;
    });
  }, []);

  const goToday = useCallback(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay());
    setWeekStart(d);
  }, []);

  const handleEventDetail = useCallback((entry: DeadlinePresetWithCompany, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.min(rect.right + 4, window.innerWidth - 300);
    const y = Math.min(rect.top, window.innerHeight - 250);
    setEventDetail({ entry, x: Math.max(8, x), y: Math.max(8, y) });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            今週
          </button>
          <button
            onClick={prevWeek}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={nextWeek}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </button>
          <h2 className="text-lg font-medium text-gray-900">{rangeLabel}</h2>
        </div>
        <DeadlineTypeLegend />
      </div>

      <WeekGrid days={days} byDate={byDate} today={today} onShowEventDetail={handleEventDetail} />

      {eventDetail && (
        <EventDetailPopover
          entry={eventDetail.entry}
          x={eventDetail.x}
          y={eventDetail.y}
          onClose={() => setEventDetail(null)}
          isAlreadyTracked={trackedMasterIds.has(eventDetail.entry.companyMasterId)}
          onAddToTracker={() => onAddEntryToTracker(eventDetail.entry)}
        />
      )}
    </div>
  );
}

// ── WeekGrid ────────────────────────────────────────────────────────────

function WeekGrid({
  days, byDate, today, onShowEventDetail,
}: {
  days: Date[];
  byDate: Map<string, DeadlinePresetWithCompany[]>;
  today: Date;
  onShowEventDetail: (entry: DeadlinePresetWithCompany, e: React.MouseEvent) => void;
}) {
  return (
    <div className="gcal-week-grid">
      {/* Header row */}
      {days.map((day, i) => {
        const isToday = isSameDay(day, today);
        const dow = day.getDay();
        return (
          <div key={`h-${i}`} className="gcal-week-header-cell">
            <div className={`text-xs font-medium ${
              dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-gray-500'
            }`}>
              {WEEKDAY_LABELS[dow]}
            </div>
            <div className={`gcal-week-day-number ${isToday ? 'gcal-week-day-number-today' : ''}`}>
              {day.getDate()}
            </div>
          </div>
        );
      })}

      {/* Body row */}
      {days.map((day, i) => {
        const key = formatDateKey(day);
        const entries = byDate.get(key) || [];
        const isToday = isSameDay(day, today);
        const dow = day.getDay();
        const isWeekend = dow === 0 || dow === 6;

        let cellClass = 'gcal-week-body-cell';
        if (isToday) cellClass += ' gcal-week-body-cell-today';
        else if (isWeekend) cellClass += ' gcal-week-body-cell-weekend';

        return (
          <div key={`b-${i}`} className={cellClass}>
            {entries.map((entry) => (
              <WeekEventChip
                key={entry.id}
                entry={entry}
                onClick={(e) => onShowEventDetail(entry, e)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── WeekEventChip ───────────────────────────────────────────────────────

function WeekEventChip({ entry, onClick }: { entry: DeadlinePresetWithCompany; onClick: (e: React.MouseEvent) => void }) {
  const color = getTypeColor(entry.deadlineType);
  const categoryLabel = DEADLINE_TYPE_LABELS[entry.deadlineType as DeadlineType] || entry.deadlineType;

  return (
    <div
      className="gcal-week-event-chip"
      style={{ borderLeftColor: color.bg }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
    >
      <span className="font-medium text-gray-900 truncate">{entry.companyName}</span>
      <span className="text-gray-500 truncate text-[11px]">
        {categoryLabel}
        {entry.deadlineTime && ` · ${entry.deadlineTime}`}
      </span>
    </div>
  );
}

// ── ListView (existing card-based layout) ───────────────────────────────

function ListView({ grouped, query, trackedMasterIds, onAddToTracker }: {
  grouped: CompanyGroup[];
  query: string;
  trackedMasterIds: Set<string>;
  onAddToTracker: (group: CompanyGroup) => void;
}) {
  const { showToast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAdding, setBulkAdding] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkReminderDays, setBulkReminderDays] = useState<number | null>(null);
  const [bulkReminderAdding, setBulkReminderAdding] = useState(false);

  const allDeadlines = useMemo(
    () => grouped.flatMap(g => g.deadlines),
    [grouped],
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev =>
      prev.size === allDeadlines.length ? new Set() : new Set(allDeadlines.map(d => d.id)),
    );
  }, [allDeadlines]);

  const handleBulkAdd = useCallback(async () => {
    const selected = allDeadlines.filter(d => selectedIds.has(d.id));
    if (selected.length === 0) return;

    setBulkAdding(true);
    setBulkProgress({ current: 0, total: selected.length });

    let successCount = 0;
    for (const entry of selected) {
      try {
        window.open(buildPresetGoogleCalendarUrl(entry), '_blank', 'noopener,noreferrer');
        successCount++;
        setBulkProgress(prev => ({ ...prev, current: prev.current + 1 }));
        await new Promise((r) => setTimeout(r, 80));
      } catch (err) {
        // Continue with remaining entries
      }
    }

    setBulkAdding(false);
    setSelectedIds(new Set());
    showToast(`${successCount}件のGoogleカレンダー追加画面を開きました`, 'success');
    trackEventAsync('deadline.bulk_gcal_add', { count: successCount });
  }, [allDeadlines, selectedIds, showToast]);

  const handleBulkReminder = useCallback(async (daysBefore: number) => {
    const selected = allDeadlines.filter(d => selectedIds.has(d.id));
    if (selected.length === 0) return;

    setBulkReminderAdding(true);
    try {
      let count = 0;
      for (const entry of selected) {
        const url = new URL(buildPresetGoogleCalendarUrl(entry));
        const currentDetails = url.searchParams.get('details') ?? '';
        const reminderGuide = `\n推奨通知: ${daysBefore}日前\n※保存後にGoogleカレンダー側で通知を追加してください。`;
        url.searchParams.set('details', `${currentDetails}${reminderGuide}`.trim());
        window.open(url.toString(), '_blank', 'noopener,noreferrer');
        count++;
        await new Promise((r) => setTimeout(r, 80));
      }
      showToast(`${count}件の通知設定ガイド付き追加画面を開きました`, 'success');
      setBulkReminderDays(null);
    } catch {
      showToast('リマインダーの設定に失敗しました', 'error');
    } finally {
      setBulkReminderAdding(false);
    }
  }, [allDeadlines, selectedIds, showToast]);

  if (grouped.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="mx-auto mb-3 w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <p className="text-sm">
          {query ? '該当する企業が見つかりませんでした' : '締切データがまだありません'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk add toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.size === allDeadlines.length && allDeadlines.length > 0}
              onChange={toggleSelectAll}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            すべて選択
          </label>
          <span className="text-xs text-gray-500">{grouped.length}社の締切情報</span>
          {selectedIds.size > 0 && (
            <span className="text-xs text-primary-600 font-medium">{selectedIds.size}件選択中</span>
          )}
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkAdd}
              disabled={bulkAdding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-md transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="12" y1="14" x2="12" y2="18" />
                <line x1="10" y1="16" x2="14" y2="16" />
              </svg>
              {bulkAdding
                ? `${bulkProgress.current}/${bulkProgress.total}件追加中...`
                : 'GCal一括追加'}
            </button>
            <div className="relative">
              <button
                onClick={() => setBulkReminderDays(prev => prev === null ? 0 : null)}
                disabled={bulkReminderAdding}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-md transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {bulkReminderAdding ? '設定中...' : 'リマインダー一括設定'}
              </button>
              {bulkReminderDays !== null && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]">
                  {[1, 3, 7].map(days => (
                    <button
                      key={days}
                      onClick={() => handleBulkReminder(days)}
                      className="w-full px-3 py-1.5 text-sm text-left text-gray-700 hover:bg-gray-50"
                    >
                      {days}日前
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {grouped.map((group) => (
        <CompanyCard
          key={group.companyMasterId}
          group={group}
          isAlreadyTracked={trackedMasterIds.has(group.companyMasterId)}
          onAddToTracker={onAddToTracker}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      ))}
    </div>
  );
}

// ── CompanyCard (unchanged) ─────────────────────────────────────────────

function CompanyCard({ group, isAlreadyTracked, onAddToTracker, selectedIds, onToggleSelect }: {
  group: CompanyGroup;
  isAlreadyTracked: boolean;
  onAddToTracker: (group: CompanyGroup) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}) {
  const logoUrl = group.companyWebsiteDomain
    ? `https://logo.clearbit.com/${group.companyWebsiteDomain}`
    : undefined;

  return (
    <div className="card p-4">
      {/* Company header */}
      <div className="flex items-center gap-3 mb-3">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="w-8 h-8 rounded object-contain bg-white border border-gray-100"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-medium">
            {group.companyName.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{group.companyName}</h3>
          {group.companyIndustry && (
            <span className="text-xs text-gray-500">{group.companyIndustry}</span>
          )}
        </div>
        {isAlreadyTracked ? (
          <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            追加済み
          </span>
        ) : (
          <button
            onClick={() => onAddToTracker(group)}
            className="text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-2.5 py-1 rounded-md transition-colors flex-shrink-0"
          >
            + Trackerに追加
          </button>
        )}
      </div>

      {/* Deadlines */}
      <div className="space-y-2">
        {group.deadlines.map((d) => {
          const urgency = getDeadlineUrgency(d.deadlineDate);
          return (
            <div
              key={d.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${URGENCY_COLORS[urgency]}`}
            >
              {onToggleSelect && (
                <input
                  type="checkbox"
                  checked={selectedIds?.has(d.id) ?? false}
                  onChange={() => onToggleSelect(d.id)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 flex-shrink-0"
                />
              )}
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${TYPE_BADGE_COLORS[d.deadlineType] || TYPE_BADGE_COLORS.other}`}>
                {DEADLINE_TYPE_LABELS[d.deadlineType as DeadlineType] || d.deadlineType}
              </span>
              <span className="text-sm font-medium flex-1">{d.label}</span>
              {d.sourceUrl && (
                <button
                  onClick={() => window.open(d.sourceUrl, '_blank')}
                  className="text-gray-400 hover:text-primary-600 transition-colors flex-shrink-0"
                  title="ソースを開く"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </button>
              )}
              <GCalButton entry={d} size="xs" />
              <ReminderButton entry={d} size="xs" />
              <span className="text-sm tabular-nums">{d.deadlineDate}</span>
              {d.deadlineTime && (
                <span className="text-xs text-gray-500">{d.deadlineTime}</span>
              )}
              {d.contributorCount > 0 && (
                <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                  {d.contributorCount}人が報告
                </span>
              )}
              <span className={`text-xs font-medium ${
                urgency === 'overdue' || urgency === 'urgent' ? 'text-red-600'
                  : urgency === 'soon' ? 'text-amber-600'
                  : 'text-gray-500'
              }`}>
                {formatDeadlineShort(d.deadlineDate)}
              </span>
            </div>
          );
        })}
      </div>

      {group.deadlines[0]?.memo && (
        <p className="text-xs text-gray-500 mt-2">{group.deadlines[0].memo}</p>
      )}
    </div>
  );
}
