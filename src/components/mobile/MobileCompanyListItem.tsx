import { Company, STATUS_LABELS } from '@jobsimplify/shared';
import { CompanyLogo } from '../ui/CompanyLogo';
import { getDeadlineUrgency, formatDeadlineShort } from '../../utils/deadlineUtils';

const URGENCY_BORDER: Record<string, string> = {
  overdue: 'border-l-error-500',
  urgent: 'border-l-warning-600',
  soon: 'border-l-yellow-500',
  normal: 'border-l-transparent',
};

interface MobileCompanyListItemProps {
  company: Company;
  onClick: (company: Company) => void;
  onStatusMenuOpen: (company: Company) => void;
}

export default function MobileCompanyListItem({ company, onClick, onStatusMenuOpen }: MobileCompanyListItemProps) {
  // Find nearest upcoming stage date
  const nextStage = company.stages
    .filter((s) => s.date)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
    .find((s) => {
      const d = new Date(s.date!);
      d.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d.getTime() >= today.getTime() - 7 * 24 * 60 * 60 * 1000; // Include 1 week overdue
    });

  const urgency = nextStage?.date ? getDeadlineUrgency(nextStage.date) : 'normal';
  const borderClass = URGENCY_BORDER[urgency];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 bg-white border-l-4 ${borderClass} border-b border-gray-100 active:bg-gray-50 transition-colors`}
      style={{ minHeight: 56 }}
    >
      {/* Main clickable area */}
      <button
        onClick={() => onClick(company)}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        <CompanyLogo
          name={company.name}
          logoUrl={company.logoUrl}
          websiteDomain={company.websiteDomain}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{company.name}</div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {company.industry && <span className="truncate">{company.industry}</span>}
            {nextStage?.date && (
              <>
                {company.industry && <span>-</span>}
                <span className={urgency === 'overdue' ? 'text-error-600 font-medium' : urgency === 'urgent' ? 'text-warning-600 font-medium' : ''}>
                  {nextStage.customLabel || STATUS_LABELS[nextStage.type]}: {formatDeadlineShort(nextStage.date)}
                </span>
              </>
            )}
          </div>
        </div>
      </button>

      {/* Status menu button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStatusMenuOpen(company);
        }}
        className="flex items-center justify-center w-11 h-11 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
        aria-label="ステータスを変更"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
    </div>
  );
}
