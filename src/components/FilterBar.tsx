export type ViewMode = 'kanban' | 'calendar';

interface FilterBarProps {
  onAddClick: () => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export default function FilterBar({
  onAddClick,
  viewMode = 'kanban',
  onViewModeChange,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-3 px-4 md:px-6 py-2.5 bg-white border-b border-gray-200 flex-shrink-0 flex-wrap md:flex-nowrap">
      {/* View toggle */}
      {onViewModeChange && (
        <div className="flex rounded-lg bg-gray-100 p-0.5">
          <button
            onClick={() => onViewModeChange('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'kanban'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            カンバン
          </button>
          <button
            onClick={() => onViewModeChange('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'calendar'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            カレンダー
          </button>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

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
