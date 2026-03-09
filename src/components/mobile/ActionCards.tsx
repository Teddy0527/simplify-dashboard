import { useMemo } from 'react';
import { Company, STATUS_LABELS } from '@jobsimplify/shared';
import { CompanyLogo } from '../ui/CompanyLogo';
import { getDeadlineUrgency, formatDeadlineShort } from '../../utils/deadlineUtils';

interface ActionItem {
  company: Company;
  label: string;
  dateStr: string;
  relativeDate: string;
  urgency: 'overdue' | 'urgent' | 'soon';
}

const URGENCY_STYLES = {
  overdue: { border: 'border-l-error-500', bg: 'bg-red-50', label: '期限切れ', labelColor: 'text-error-600' },
  urgent: { border: 'border-l-warning-600', bg: 'bg-orange-50', label: '3日以内', labelColor: 'text-warning-700' },
  soon: { border: 'border-l-yellow-500', bg: 'bg-yellow-50', label: '1週間以内', labelColor: 'text-yellow-700' },
} as const;

interface ActionCardsProps {
  companies: Company[];
  onCardClick: (company: Company) => void;
}

export default function ActionCards({ companies, onCardClick }: ActionCardsProps) {
  const actionItems = useMemo(() => {
    const items: ActionItem[] = [];

    for (const company of companies) {
      // Skip closed statuses
      if (company.status === 'rejected' || company.status === 'declined') continue;

      // Check stages with dates
      for (const stage of company.stages) {
        if (!stage.date) continue;
        const urgency = getDeadlineUrgency(stage.date);
        if (urgency === 'normal') continue;

        items.push({
          company,
          label: stage.customLabel || STATUS_LABELS[stage.type],
          dateStr: stage.date,
          relativeDate: formatDeadlineShort(stage.date),
          urgency,
        });
      }
    }

    // Sort: overdue first, then urgent, then soon
    const urgencyOrder = { overdue: 0, urgent: 1, soon: 2 };
    items.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    // Deduplicate by company (keep most urgent per company)
    const seen = new Set<string>();
    const deduped: ActionItem[] = [];
    for (const item of items) {
      if (!seen.has(item.company.id)) {
        seen.add(item.company.id);
        deduped.push(item);
      }
    }

    return deduped;
  }, [companies]);

  if (actionItems.length === 0) return null;

  const displayed = actionItems.slice(0, 5);
  const remaining = actionItems.length - displayed.length;

  return (
    <div className="px-4 pb-3">
      <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning-600">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        今すぐやること
      </h3>
      <div className="space-y-2">
        {displayed.map((item) => {
          const style = URGENCY_STYLES[item.urgency];
          return (
            <button
              key={`${item.company.id}-${item.dateStr}`}
              onClick={() => onCardClick(item.company)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-l-4 ${style.border} ${style.bg} text-left transition-colors active:opacity-80`}
            >
              <CompanyLogo
                name={item.company.name}
                logoUrl={item.company.logoUrl}
                websiteDomain={item.company.websiteDomain}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{item.company.name}</div>
                <div className="text-xs text-gray-500 truncate">{item.label}</div>
              </div>
              <div className={`text-xs font-semibold whitespace-nowrap ${style.labelColor}`}>
                {item.relativeDate}
              </div>
            </button>
          );
        })}
      </div>
      {remaining > 0 && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          他{remaining}件
        </p>
      )}
    </div>
  );
}
