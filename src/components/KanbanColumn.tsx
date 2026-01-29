import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMemo } from 'react';
import { Company, SelectionStatus } from '../shared/types';
import KanbanCard from './KanbanCard';

export interface ColumnDef {
  id: string;
  label: string;
  icon: string;
  color: string;
  statuses: SelectionStatus[];
}

interface KanbanColumnProps {
  column: ColumnDef;
  companies: Company[];
  onCardClick: (company: Company) => void;
  isOver?: boolean;
}

export default function KanbanColumn({ column, companies, onCardClick, isOver }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: column.id });
  const itemIds = useMemo(() => companies.map((c) => c.id), [companies]);

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-3 mb-2">
        <span>{column.icon}</span>
        <h3
          className="text-sm font-semibold text-[var(--color-navy-800)] tracking-wide"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {column.label}
        </h3>
        <span className="ml-auto text-xs font-medium text-white bg-[var(--color-navy-400)] rounded-full w-5 h-5 flex items-center justify-center">
          {companies.length}
        </span>
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto custom-scrollbar px-1 pb-4 rounded-lg transition-colors duration-200 min-h-[80px] ${isOver ? 'bg-[var(--color-navy-50)]' : ''}`}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {companies.length === 0 ? (
            <div className="text-center py-8 text-xs text-[var(--color-navy-400)]">
              まだありません
            </div>
          ) : (
            companies.map((company) => (
              <KanbanCard
                key={company.id}
                company={company}
                onClick={onCardClick}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
