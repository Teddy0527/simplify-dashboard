import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Company, STATUS_LABELS } from '@jobsimplify/shared';
import { CompanyLogo } from './ui/CompanyLogo';
import { getNearestDeadline, getDeadlineUrgency, formatDeadlineShort, getNextSelectionStep } from '../utils/deadlineHelpers';

interface KanbanCardProps {
  company: Company;
  onClick: (company: Company) => void;
  isDragOverlay?: boolean;
  esCount?: number;
  onESClick?: (companyId: string) => void;
}


export default function KanbanCard({ company, onClick, isDragOverlay, esCount, onESClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: company.id });

  const style = isDragOverlay
    ? { width: 280 }
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      {...(!isDragOverlay ? { ...attributes, ...listeners } : {})}
      data-kanban-card
      style={style}
      className={`card cursor-pointer mb-2 touch-none ${isDragging ? 'opacity-30 scale-95' : ''} ${isDragOverlay ? 'shadow-xl' : ''}`}
      onClick={() => !isDragging && onClick(company)}
    >
      <div className="flex items-start gap-3">
        <CompanyLogo
          name={company.name}
          logoUrl={company.logoUrl}
          websiteDomain={company.websiteDomain}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {company.name}
          </h4>
          {company.industry && (
            <p className="text-xs text-gray-500 mt-0.5">{company.industry}</p>
          )}
        </div>
      </div>

      {/* Links + ES badge */}
      <div className="mt-2 flex items-center gap-3">
        {company.loginUrl && (
          <a
            href={company.loginUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-gray-500 hover:text-primary-600 flex items-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
            マイページ
          </a>
        )}
        {company.recruitUrl && (
          <a
            href={company.recruitUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-gray-500 hover:text-primary-600 flex items-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
            採用ページ
          </a>
        )}
        {esCount != null && esCount > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onESClick?.(company.id); }}
            className="text-xs text-gray-500 hover:text-primary-600 flex items-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            ES ({esCount})
          </button>
        )}
      </div>

      {/* Nearest deadline */}
      {(() => {
        const nearest = getNearestDeadline(company.deadlines ?? []);
        if (!nearest) return null;
        const urgency = getDeadlineUrgency(nearest.date);
        const textColor =
          urgency === 'overdue' || urgency === 'urgent' ? 'text-red-600'
            : urgency === 'soon' ? 'text-amber-600'
            : 'text-gray-500';
        return (
          <div className={`mt-2 flex items-center gap-1 ${textColor}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="text-xs font-medium truncate">{nearest.label}</span>
            <span className="text-xs">{formatDeadlineShort(nearest.date)}</span>
          </div>
        );
      })()}

      <div className="mt-2 flex items-center justify-end">
        {(() => {
          const next = getNextSelectionStep(company.stages ?? []);
          if (next) {
            const dateDisplay = next.date
              ? `${new Date(next.date).getMonth() + 1}/${new Date(next.date).getDate()}${next.time ? ` ${next.time}` : ''}`
              : '';
            return (
              <span className="text-xs py-0.5 px-2 border border-primary-200 rounded-full text-primary-700 bg-primary-50 truncate">
                {next.label}{dateDisplay ? ` : ${dateDisplay}` : ''}
              </span>
            );
          }
          return (
            <span className="text-xs py-0.5 px-2 border border-gray-200 rounded-full text-gray-600 bg-white">
              {STATUS_LABELS[company.status]}
            </span>
          );
        })()}
      </div>
    </div>
  );
}
