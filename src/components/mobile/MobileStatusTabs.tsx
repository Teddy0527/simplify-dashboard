import { Company } from '@jobsimplify/shared';
import { COLUMNS, type ColumnDef } from '../../constants/kanbanColumns';

interface MobileStatusTabsProps {
  companies: Company[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function MobileStatusTabs({ companies, activeTab, onTabChange }: MobileStatusTabsProps) {
  function getCount(col: ColumnDef): number {
    return companies.filter((c) => col.statuses.includes(c.status)).length;
  }

  return (
    <div className="px-4 pb-2">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* All tab */}
        <button
          onClick={() => onTabChange('all')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap snap-start transition-colors ${
            activeTab === 'all'
              ? 'bg-primary-700 text-white'
              : 'bg-gray-100 text-gray-600 active:bg-gray-200'
          }`}
          style={{ minHeight: 44 }}
        >
          すべて
          <span className={`text-xs font-semibold ${activeTab === 'all' ? 'text-white/80' : 'text-gray-400'}`}>
            {companies.length}
          </span>
        </button>
        {COLUMNS.map((col) => {
          const count = getCount(col);
          return (
            <button
              key={col.id}
              onClick={() => onTabChange(col.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap snap-start transition-colors ${
                activeTab === col.id
                  ? 'bg-primary-700 text-white'
                  : 'bg-gray-100 text-gray-600 active:bg-gray-200'
              }`}
              style={{ minHeight: 44 }}
            >
              {col.label}
              <span className={`text-xs font-semibold ${activeTab === col.id ? 'text-white/80' : 'text-gray-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
