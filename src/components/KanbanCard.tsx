import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Company } from '@jobsimplify/shared';
import { CompanyLogo } from './ui/CompanyLogo';

interface KanbanCardProps {
  company: Company;
  onClick: (company: Company) => void;
  isDragOverlay?: boolean;
  isSelectionColumn?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (company: Company) => void;
  hasSelection?: boolean;
}

const KanbanCard = memo(function KanbanCard({ company, onClick, isDragOverlay, isSelectionColumn: _isSelectionColumn, isSelected, onToggleSelect, hasSelection }: KanbanCardProps) {
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
      className={`card cursor-pointer mb-2 touch-none group ${isDragging ? 'opacity-30 scale-95' : ''} ${isDragOverlay ? 'shadow-xl' : ''} ${isSelected ? 'ring-2 ring-primary-500' : ''}`}
      onClick={() => !isDragging && onClick(company)}
    >
      {/* Zone A: ID */}
      <div className="flex items-center gap-3">
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={!!isSelected}
            onChange={(e) => { e.stopPropagation(); onToggleSelect(company); }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ accentColor: 'var(--color-primary-600)' }}
            className={`w-4 h-4 rounded cursor-pointer flex-shrink-0 transition-opacity ${hasSelection || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          />
        )}
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
          </div>
          {company.industry && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{company.industry}</p>
          )}
        </div>
      </div>

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
      </div>
    </div>
  );
});

export default KanbanCard;
