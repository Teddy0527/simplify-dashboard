import { useMemo } from 'react';
import type { Company, CompanyDeadline } from '@jobsimplify/shared';
import { DEADLINE_TYPE_LABELS } from '@jobsimplify/shared';
import { daysUntilDeadline, getDeadlineUrgency, formatDeadlineShort, DEADLINE_EMOJI } from '../utils/deadlineUtils';

interface DeadlineBarItem {
  company: Company;
  deadline: CompanyDeadline;
  urgency: 'overdue' | 'urgent' | 'soon' | 'normal';
  daysLeft: number;
}

interface DeadlineBarProps {
  companies: Company[];
  onDeadlineClick?: (companyId: string) => void;
}

const URGENCY_STYLES: Record<string, string> = {
  overdue: 'bg-red-50 border-red-200 text-red-700',
  urgent: 'bg-red-50 border-red-200 text-red-700',
  soon: 'bg-amber-50 border-amber-200 text-amber-700',
  normal: 'bg-gray-50 border-gray-200 text-gray-600',
};

const MAX_VISIBLE = 5;

export default function DeadlineBar({ companies, onDeadlineClick }: DeadlineBarProps) {
  const items = useMemo(() => {
    const result: DeadlineBarItem[] = [];
    for (const company of companies) {
      if (!company.deadlines) continue;
      for (const dl of company.deadlines) {
        const days = daysUntilDeadline(dl.date);
        // Show overdue (up to -7 days) and upcoming 7 days
        if (days >= -7 && days <= 7) {
          result.push({
            company,
            deadline: dl,
            urgency: getDeadlineUrgency(dl.date),
            daysLeft: days,
          });
        }
      }
    }
    // Sort: overdue first (most overdue), then by soonest
    result.sort((a, b) => a.daysLeft - b.daysLeft);
    return result;
  }, [companies]);

  if (items.length === 0) return null;

  const visibleItems = items.slice(0, MAX_VISIBLE);
  const overflowCount = items.length - MAX_VISIBLE;

  return (
    <div className="px-4 pt-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <span className="text-xs font-medium text-gray-500 whitespace-nowrap flex-shrink-0">
          直近の締切
        </span>
        {visibleItems.map((item) => (
          <button
            key={`${item.company.id}-${item.deadline.id}`}
            onClick={() => onDeadlineClick?.(item.company.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs whitespace-nowrap transition-all hover:shadow-sm flex-shrink-0 ${URGENCY_STYLES[item.urgency]}`}
          >
            <span>{DEADLINE_EMOJI[item.deadline.type] || '\u{1F4CC}'}</span>
            <span className="font-medium max-w-[80px] truncate">{item.company.name}</span>
            <span className="opacity-70">{DEADLINE_TYPE_LABELS[item.deadline.type]}</span>
            <span className="font-semibold">{formatDeadlineShort(item.deadline.date)}</span>
          </button>
        ))}
        {overflowCount > 0 && (
          <span className="flex items-center px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
            +{overflowCount}件
          </span>
        )}
      </div>
    </div>
  );
}
