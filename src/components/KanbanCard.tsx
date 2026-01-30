import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Company, STATUS_LABELS } from '@simplify/shared';

interface KanbanCardProps {
  company: Company;
  onClick: (company: Company) => void;
  isDragOverlay?: boolean;
}

function getInitialColor(name: string): string {
  const colors = [
    'bg-primary-800',
    'bg-primary-600',
    'bg-success-600',
    'bg-warning-600',
    'bg-primary-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}


export default function KanbanCard({ company, onClick, isDragOverlay }: KanbanCardProps) {
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
        <div className={`w-9 h-9 rounded-lg ${getInitialColor(company.name)} flex items-center justify-center flex-shrink-0`}>
          <span className="text-white text-sm font-semibold">{company.name[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {company.name}
          </h4>
          {company.industry && (
            <p className="text-xs text-gray-500 mt-0.5">{company.industry}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {company.loginUrl ? (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
            マイページ
          </span>
        ) : (
          <span />
        )}
        <span className="text-xs py-0.5 px-2 border border-gray-200 rounded-full text-gray-600 bg-white">
          {STATUS_LABELS[company.status]}
        </span>
      </div>
    </div>
  );
}
