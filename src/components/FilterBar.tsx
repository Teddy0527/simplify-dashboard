import { useState, useEffect, useRef, useMemo } from 'react';
import type { Company } from '@jobsimplify/shared';
import { CompanyLogo } from './ui/CompanyLogo';
import { getNearestDeadline, formatDeadlineShort, getDeadlineUrgency } from '../utils/deadlineHelpers';

export type ViewMode = 'kanban' | 'calendar';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  industryFilter: string;
  onIndustryChange: (industry: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  industries: string[];
  onAddClick: () => void;
  companies?: Company[];
  onCompanyClick?: (company: Company) => void;
}

const urgencyColors: Record<string, string> = {
  overdue: 'bg-red-100 text-red-700',
  urgent: 'bg-orange-100 text-orange-700',
  soon: 'bg-yellow-100 text-yellow-700',
  normal: 'bg-blue-100 text-blue-700',
};

export default function FilterBar({
  searchQuery,
  onSearchChange,
  industryFilter,
  onIndustryChange,
  viewMode,
  onViewModeChange,
  industries,
  onAddClick,
  companies,
  onCompanyClick,
}: FilterBarProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearchChange(localQuery), 300);
    return () => clearTimeout(timerRef.current);
  }, [localQuery]);

  // Outside click handler
  useEffect(() => {
    if (!showSuggestions) return;
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [showSuggestions]);

  // Escape key handler
  useEffect(() => {
    if (!showSuggestions) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowSuggestions(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions]);

  // Suggested companies logic
  const suggestedCompanies = useMemo(() => {
    if (!companies || companies.length === 0) return [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Companies with future deadlines, sorted by nearest deadline
    const withDeadline: { company: Company; nearestDate: string }[] = [];
    const withoutDeadline: Company[] = [];

    for (const c of companies) {
      const nearest = getNearestDeadline(c.deadlines ?? []);
      if (nearest && new Date(nearest.date) >= now) {
        withDeadline.push({ company: c, nearestDate: nearest.date });
      } else {
        withoutDeadline.push(c);
      }
    }

    withDeadline.sort((a, b) => a.nearestDate.localeCompare(b.nearestDate));

    // Day-based seed shuffle for companies without deadlines
    const daySeed = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
    const shuffled = [...withoutDeadline].sort((a, b) => {
      const hashA = simpleHash(a.id + daySeed);
      const hashB = simpleHash(b.id + daySeed);
      return hashA - hashB;
    });

    const result = [
      ...withDeadline.map(d => d.company),
      ...shuffled,
    ];

    return result.slice(0, 6);
  }, [companies]);

  // Filtered companies for search suggestions
  const filteredCompanies = useMemo(() => {
    if (!localQuery || !companies || companies.length === 0) return [];
    const q = localQuery.toLowerCase();
    return companies
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [localQuery, companies]);

  function handleFocus() {
    setShowSuggestions(true);
  }

  function handleChange(value: string) {
    setLocalQuery(value);
    setShowSuggestions(true);
  }

  function handleSuggestionClick(company: Company) {
    setShowSuggestions(false);
    onCompanyClick?.(company);
  }

  function renderCompanyRow(company: Company) {
    const nearest = getNearestDeadline(company.deadlines ?? []);
    const hasFutureDeadline = nearest && new Date(nearest.date) >= new Date(new Date().setHours(0, 0, 0, 0));
    return (
      <button
        key={company.id}
        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
        onMouseDown={(e) => {
          e.preventDefault();
          handleSuggestionClick(company);
        }}
      >
        <CompanyLogo
          name={company.name}
          logoUrl={company.logoUrl}
          websiteDomain={company.websiteDomain}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{company.name}</div>
          {company.industry && (
            <div className="text-xs text-gray-500 truncate">{company.industry}</div>
          )}
        </div>
        {hasFutureDeadline && nearest && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap ${urgencyColors[getDeadlineUrgency(nearest.date)]}`}>
            {formatDeadlineShort(nearest.date)}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 px-6 py-2.5 bg-white border-b border-gray-200 flex-shrink-0">
      {/* Search */}
      <div className="relative w-44" ref={containerRef}>
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          placeholder="検索..."
          className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
        />

        {/* Suggestion dropdown */}
        {showSuggestions && (() => {
          const items = localQuery ? filteredCompanies : suggestedCompanies;
          if (items.length === 0) return null;
          const header = localQuery ? '検索候補' : 'おすすめ企業';
          return (
            <div className="absolute left-0 top-full mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                {header}
              </div>
              {items.map((company) => renderCompanyRow(company))}
            </div>
          );
        })()}
      </div>

      {/* Industry filter */}
      <select
        value={industryFilter}
        onChange={(e) => onIndustryChange(e.target.value)}
        className="text-sm py-1.5 px-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-primary-500 transition-colors cursor-pointer"
      >
        <option value="">全業界</option>
        {industries.map((ind) => (
          <option key={ind} value={ind}>{ind}</option>
        ))}
      </select>

      {/* Spacer */}
      <div className="flex-1" />

      {/* View toggle - Segmented control */}
      <div className="flex bg-gray-100 rounded-lg p-0.5">
        <button
          onClick={() => onViewModeChange('kanban')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            viewMode === 'kanban' ? 'bg-white text-primary-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          カンバン
        </button>
        <button
          onClick={() => onViewModeChange('calendar')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            viewMode === 'calendar' ? 'bg-white text-primary-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          カレンダー
        </button>
      </div>

      {/* Add button */}
      <button
        onClick={onAddClick}
        className="btn-primary text-sm py-1.5 px-3 whitespace-nowrap"
      >
        + 追加
      </button>
    </div>
  );
}

/** Simple hash for deterministic day-based shuffle */
function simpleHash(str: string | number): number {
  const s = String(str);
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
