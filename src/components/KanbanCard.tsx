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

function formatDeadline(deadline: string): string {
  const d = new Date(deadline);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const label = `${d.getMonth() + 1}/${d.getDate()}`;
  if (diff < 0) return `${label} (期限切れ)`;
  if (diff <= 3) return `${label} (あと${diff}日)`;
  return label;
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

  const isUrgent = company.deadline && (() => {
    const diff = Math.ceil((new Date(company.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 3;
  })();

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      {...(!isDragOverlay ? { ...attributes, ...listeners } : {})}
      style={style}
      className={`card cursor-pointer mb-2 touch-none ${isUrgent ? 'card-deadline-soon' : ''} ${isDragging ? 'opacity-30 scale-95' : ''} ${isDragOverlay ? 'shadow-xl' : ''}`}
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
        {company.deadline ? (
          <span className={`text-xs ${isUrgent ? 'text-warning-600 font-medium' : 'text-gray-400'}`}>
            {formatDeadline(company.deadline)}
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
