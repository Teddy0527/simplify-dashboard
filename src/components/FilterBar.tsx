import { useState, useEffect, useRef } from 'react';

export type ViewMode = 'kanban' | 'list';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  industryFilter: string;
  onIndustryChange: (industry: string) => void;
  deadlineOnly: boolean;
  onDeadlineOnlyChange: (value: boolean) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  industries: string[];
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  industryFilter,
  onIndustryChange,
  deadlineOnly,
  onDeadlineOnlyChange,
  viewMode,
  onViewModeChange,
  industries,
}: FilterBarProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearchChange(localQuery), 300);
    return () => clearTimeout(timerRef.current);
  }, [localQuery]);

  return (
    <div className="flex items-center gap-4 px-6 py-3 bg-white border-b border-[var(--color-navy-100)] flex-shrink-0">
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-navy-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="企業名で検索..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--color-navy-200)] bg-white focus:outline-none focus:border-[var(--color-navy-600)] transition-colors"
        />
      </div>

      {/* Industry filter */}
      <select
        value={industryFilter}
        onChange={(e) => onIndustryChange(e.target.value)}
        className="text-sm py-2 px-3 border border-[var(--color-navy-200)] bg-white focus:outline-none focus:border-[var(--color-navy-600)] transition-colors cursor-pointer"
      >
        <option value="">全業界</option>
        {industries.map((ind) => (
          <option key={ind} value={ind}>{ind}</option>
        ))}
      </select>

      {/* Deadline toggle */}
      <label className="flex items-center gap-2 text-sm text-[var(--color-navy-700)] cursor-pointer select-none">
        <input
          type="checkbox"
          checked={deadlineOnly}
          onChange={(e) => onDeadlineOnlyChange(e.target.checked)}
          className="checkbox-custom"
        />
        締切あり
      </label>

      {/* Spacer */}
      <div className="flex-1" />

      {/* View toggle */}
      <div className="flex border border-[var(--color-navy-200)]">
        <button
          onClick={() => onViewModeChange('kanban')}
          className={`px-3 py-1.5 text-sm transition-colors ${viewMode === 'kanban' ? 'bg-[var(--color-navy-800)] text-white' : 'text-[var(--color-navy-600)] hover:bg-[var(--color-navy-50)]'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`px-3 py-1.5 text-sm transition-colors ${viewMode === 'list' ? 'bg-[var(--color-navy-800)] text-white' : 'text-[var(--color-navy-600)] hover:bg-[var(--color-navy-50)]'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
