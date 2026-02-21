// Phase 1: Shared components extracted from AnalyticsTab
// Phase 3: TrendBadge + computeTrend added
// Phase 5: Redesigned SummaryCard (icon + large value) + pill TrendBadge

import type { ReactNode } from 'react';

export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    borderRadius: 12,
    border: 'none',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
    fontSize: 13,
    padding: '8px 12px',
  },
  labelStyle: { fontWeight: 600, color: '#1f2937', marginBottom: 4 },
  cursor: { fill: 'rgba(99,102,241,0.08)' },
};

export type SortKey = 'createdAt' | 'lastActiveAt' | 'companyCount' | 'esCount' | 'totalEvents' | 'profileCompletion' | 'activeDays' | 'returnRate' | 'last7dEvents';
export type SortDir = 'asc' | 'desc';

export function EmptyCard({ message }: { message: string }) {
  return (
    <div className="admin-card px-4 py-6 text-center text-gray-400 text-sm">
      {message}
    </div>
  );
}

export function SummaryCard({ label, value, suffix, className, trend, icon, subtitle }: {
  label: string;
  value: number;
  suffix?: string;
  className?: string;
  trend?: number | null;
  icon?: ReactNode;
  subtitle?: string;
}) {
  return (
    <div className={`admin-card px-5 py-4 ${className ?? ''}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-primary-500">{icon}</span>}
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-gray-900 tabular-nums">
          {value.toLocaleString()}{suffix && <span className="text-sm font-normal text-gray-500 ml-0.5">{suffix}</span>}
        </p>
        {trend !== undefined && <TrendBadge trend={trend} />}
      </div>
      {subtitle && <p className="text-xs text-gray-400 mt-1 tabular-nums">{subtitle}</p>}
    </div>
  );
}

export function SortableHeader({
  label,
  sortKey,
  currentKey,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  dir: SortDir;
  onClick: (key: SortKey) => void;
}) {
  const isActive = currentKey === sortKey;
  return (
    <th
      className="px-3 py-3.5 cursor-pointer select-none hover:text-gray-700 whitespace-nowrap font-semibold text-gray-600"
      onClick={() => onClick(sortKey)}
    >
      {label}
      {isActive && (
        <span className="ml-1">{dir === 'asc' ? '↑' : '↓'}</span>
      )}
    </th>
  );
}

// Phase 3: Trend computation

export function computeTrend(current: number | undefined, previous: number | undefined): number | null {
  if (current === undefined || previous === undefined) return null;
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function TrendBadge({ trend }: { trend: number | null }) {
  if (trend === null || trend === undefined) {
    return <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-400" aria-label="トレンドデータなし">-</span>;
  }

  if (trend > 0) {
    return (
      <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600" aria-label={`${trend}%増加`}>
        <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2}>
          <path d="M6 9V3M6 3L3 6M6 3l3 3" />
        </svg>
        {trend}%
      </span>
    );
  }

  if (trend < 0) {
    return (
      <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600" aria-label={`${Math.abs(trend)}%減少`}>
        <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2}>
          <path d="M6 3v6M6 9l3-3M6 9L3 6" />
        </svg>
        {Math.abs(trend)}%
      </span>
    );
  }

  return (
    <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-500" aria-label="変化なし">
      <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2}>
        <path d="M2 6h8" />
      </svg>
      0%
    </span>
  );
}

export function PeriodSelector({ days, onChange }: { days: number; onChange: (d: number) => void }) {
  return (
    <div className="inline-flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
      {[30, 60, 90].map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={days === d ? 'admin-pill-tab-active' : 'admin-pill-tab'}
        >
          {d}日
        </button>
      ))}
    </div>
  );
}
