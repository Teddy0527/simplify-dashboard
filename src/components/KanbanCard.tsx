import { memo, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Company, STATUS_LABELS } from '@jobsimplify/shared';
import { CompanyLogo } from './ui/CompanyLogo';
import { getUnifiedNextAction, getNextSelectionStep } from '../utils/deadlineHelpers';

interface KanbanCardProps {
  company: Company;
  onClick: (company: Company) => void;
  isDragOverlay?: boolean;
  esCount?: number;
  onESClick?: (companyId: string) => void;
  onDelete?: (company: Company) => void;
  isSelectionColumn?: boolean;
}

const URGENCY_CARD_CLASS: Record<string, string> = {
  overdue: 'card-deadline-overdue',
  urgent: 'card-deadline-urgent',
  soon: 'card-deadline-soon',
};

const URGENCY_TEXT_CLASS: Record<string, string> = {
  overdue: 'text-red-600',
  urgent: 'text-red-600',
  soon: 'text-amber-600',
  normal: 'text-gray-600',
};

const KanbanCard = memo(function KanbanCard({ company, onClick, isDragOverlay, esCount, onESClick, onDelete, isSelectionColumn }: KanbanCardProps) {
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

  const nextAction = useMemo(
    () => getUnifiedNextAction(company.deadlines ?? [], company.stages ?? []),
    [company.deadlines, company.stages]
  );

  // サブステータス: 選考中列のみ表示
  const subStatus = useMemo(() => {
    if (!isSelectionColumn) return null;
    const step = getNextSelectionStep(company.stages ?? []);
    return step?.label ?? STATUS_LABELS[company.status];
  }, [isSelectionColumn, company.stages, company.status]);

  const urgencyCardClass = nextAction ? URGENCY_CARD_CLASS[nextAction.urgency] ?? '' : '';

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      {...(!isDragOverlay ? { ...attributes, ...listeners } : {})}
      data-kanban-card
      style={style}
      className={`card cursor-pointer mb-2 touch-none group ${urgencyCardClass} ${isDragging ? 'opacity-30 scale-95' : ''} ${isDragOverlay ? 'shadow-xl' : ''}`}
      onClick={() => !isDragging && onClick(company)}
    >
      {/* Zone A: ID */}
      <div className="flex items-start gap-3">
        <CompanyLogo
          name={company.name}
          logoUrl={company.logoUrl}
          websiteDomain={company.websiteDomain}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              {company.name}
            </h4>
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(company); }}
                className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-error-500 hover:bg-error-50"
                title="削除"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {company.industry && (
              <p className="text-xs text-gray-500 truncate">{company.industry}</p>
            )}
            {subStatus && (
              <span className="text-[10px] text-gray-400 truncate">{subStatus}</span>
            )}
          </div>
        </div>
      </div>

      {/* Zone B: 統合締切 */}
      {nextAction && (
        <div className={`mt-2 flex items-center gap-1.5 ${URGENCY_TEXT_CLASS[nextAction.urgency] ?? 'text-gray-600'}`}>
          <svg className="flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span className="text-sm font-medium truncate">{nextAction.label}</span>
          {nextAction.relativeDate && (
            <span className="text-sm font-semibold whitespace-nowrap">{nextAction.relativeDate}</span>
          )}
          {nextAction.absoluteDate && (
            <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">({nextAction.absoluteDate})</span>
          )}
        </div>
      )}

      {/* Zone C: リンク (ホバー時のみ表示) */}
      <div className="mt-2 flex items-center gap-3 h-5 opacity-0 group-hover:opacity-100 transition-opacity">
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
    </div>
  );
});

export default KanbanCard;
