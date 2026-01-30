import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMemo } from 'react';
import { Company, SelectionStatus } from '@simplify/shared';
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
    <div className="flex flex-col w-[280px] min-w-[280px]">
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-3 mb-2">
        <span>{column.icon}</span>
        <h3 className="text-sm font-semibold text-gray-800 tracking-wide">
          {column.label}
        </h3>
        <span className="ml-auto text-xs font-medium text-white bg-gray-400 rounded-full w-5 h-5 flex items-center justify-center">
          {companies.length}
        </span>
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto custom-scrollbar px-1 pb-4 rounded-lg transition-colors duration-200 min-h-[80px] ${isOver ? 'bg-primary-50' : 'bg-gray-100/50'}`}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {companies.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
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
