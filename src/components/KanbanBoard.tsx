import { useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  pointerWithin,
  rectIntersection,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  CollisionDetection,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Company, SelectionStatus } from '@jobsimplify/shared';
import KanbanColumn, { ColumnDef } from './KanbanColumn';
import KanbanCard from './KanbanCard';

const COLUMNS: ColumnDef[] = [
  {
    id: 'interested',
    label: '興味あり',
    icon: '◇',
    color: 'var(--color-primary-500)',
    statuses: ['interested'],
  },
  {
    id: 'es_submitted',
    label: 'ES提出',
    icon: '→',
    color: 'var(--color-success-600)',
    statuses: ['es_submitted'],
  },
  {
    id: 'selection',
    label: '選考中',
    icon: '⟳',
    color: 'var(--color-warning-600)',
    statuses: ['webtest', 'gd', 'interview_1', 'interview_2', 'interview_3', 'interview_final'],
  },
  {
    id: 'offer',
    label: '内定',
    icon: '✓',
    color: 'var(--color-success-600)',
    statuses: ['offer'],
  },
  {
    id: 'closed',
    label: '不合格 / 辞退',
    icon: '—',
    color: 'var(--color-gray-400)',
    statuses: ['rejected', 'declined'],
  },
];

const COLUMN_DEFAULT_STATUS: Record<string, SelectionStatus> = {
  interested: 'interested',
  es_submitted: 'es_submitted',
  selection: 'webtest',
  offer: 'offer',
  closed: 'rejected',
};

function findColumnId(status: SelectionStatus): string {
  return COLUMNS.find((col) => col.statuses.includes(status))?.id ?? 'interested';
}

const COLUMN_IDS = new Set(COLUMNS.map((c) => c.id));

const customCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);

  if (pointerCollisions.length === 0) {
    return rectIntersection(args);
  }

  const columnHits = pointerCollisions.filter((c) => COLUMN_IDS.has(c.id as string));
  const cardHits = pointerCollisions.filter((c) => !COLUMN_IDS.has(c.id as string));

  if (cardHits.length > 0) {
    const filteredArgs = {
      ...args,
      droppableContainers: args.droppableContainers.filter((container) =>
        cardHits.some((hit) => hit.id === container.id)
      ),
    };
    const closest = closestCenter(filteredArgs);
    return closest.length > 0 ? closest : columnHits;
  }

  return columnHits;
};

interface KanbanBoardProps {
  companies: Company[];
  onReorder: (companies: Company[]) => void;
  onCardClick: (company: Company) => void;
  esCountMap?: Map<string, number>;
  onESClick?: (companyId: string) => void;
  onCardDelete?: (company: Company) => void;
}

export default function KanbanBoard({ companies, onReorder, onCardClick, esCountMap, onESClick, onCardDelete }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const lastOverId = useRef<string | null>(null);

  // Grab-to-scroll state
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingScroll = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const velocity = useRef(0);
  const lastClientX = useRef(0);
  const lastTime = useRef(0);
  const momentumRaf = useRef<number>(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function onMouseDown(e: MouseEvent) {
      // Only trigger on background/column areas, not on cards
      const target = e.target as HTMLElement;
      if (target.closest('[data-kanban-card]')) return;

      isDraggingScroll.current = true;
      startX.current = e.clientX;
      scrollLeftStart.current = el!.scrollLeft;
      lastClientX.current = e.clientX;
      lastTime.current = Date.now();
      velocity.current = 0;
      cancelAnimationFrame(momentumRaf.current);
      el!.style.cursor = 'grabbing';
      el!.style.userSelect = 'none';
    }

    function onMouseMove(e: MouseEvent) {
      if (!isDraggingScroll.current) return;
      const dx = e.clientX - startX.current;
      el!.scrollLeft = scrollLeftStart.current - dx;

      const now = Date.now();
      const dt = now - lastTime.current;
      if (dt > 0) {
        velocity.current = (e.clientX - lastClientX.current) / dt;
      }
      lastClientX.current = e.clientX;
      lastTime.current = now;
    }

    function onMouseUp() {
      if (!isDraggingScroll.current) return;
      isDraggingScroll.current = false;
      el!.style.cursor = '';
      el!.style.userSelect = '';

      // Momentum scroll
      let v = velocity.current * 15; // amplify
      function step() {
        if (Math.abs(v) < 0.5) return;
        el!.scrollLeft -= v;
        v *= 0.92; // friction
        momentumRaf.current = requestAnimationFrame(step);
      }
      step();
    }

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(momentumRaf.current);
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeCompany = activeId ? companies.find((c) => c.id === activeId) : null;

  const findColumnForId = useCallback((id: string): string | undefined => {
    if (COLUMNS.some((c) => c.id === id)) return id;
    const company = companies.find((c) => c.id === id);
    if (!company) return undefined;
    return findColumnId(company.status);
  }, [companies]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
    lastOverId.current = null;
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) {
      setOverColumnId(null);
      return;
    }

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    if (lastOverId.current === overIdStr) return;
    lastOverId.current = overIdStr;

    const activeCol = findColumnForId(activeIdStr);
    const overCol = findColumnForId(overIdStr);

    setOverColumnId(overCol && overCol !== activeCol ? overCol : null);

    if (!activeCol || !overCol || activeCol === overCol) return;

    const newStatus = COLUMN_DEFAULT_STATUS[overCol];
    if (!newStatus) return;

    const activeCompany = companies.find((c) => c.id === activeIdStr);
    if (!activeCompany || findColumnId(activeCompany.status) === overCol) return;

    const updated = companies.map((c) =>
      c.id === activeIdStr ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c
    );

    const isOverColumn = COLUMNS.some((c) => c.id === overIdStr);
    if (!isOverColumn) {
      const oldIndex = updated.findIndex((c) => c.id === activeIdStr);
      const newIndex = updated.findIndex((c) => c.id === overIdStr);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        onReorder(arrayMove(updated, oldIndex, newIndex));
        return;
      }
    }

    onReorder(updated);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setOverColumnId(null);
    lastOverId.current = null;

    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    if (activeIdStr === overIdStr) return;

    const activeCol = findColumnForId(activeIdStr);
    const overCol = findColumnForId(overIdStr);

    if (activeCol === overCol && !COLUMNS.some((c) => c.id === overIdStr)) {
      const oldIndex = companies.findIndex((c) => c.id === activeIdStr);
      const newIndex = companies.findIndex((c) => c.id === overIdStr);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        onReorder(arrayMove([...companies], oldIndex, newIndex));
      }
    }
  }

  function handleDragCancel() {
    setActiveId(null);
    setOverColumnId(null);
    lastOverId.current = null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div ref={scrollRef} className="flex gap-4 pb-4 px-6 overflow-x-auto kanban-scroll cursor-grab">
        {COLUMNS.map((col) => {
          const filtered = companies.filter((c) => col.statuses.includes(c.status));
          return (
            <KanbanColumn
              key={col.id}
              column={col}
              companies={filtered}
              onCardClick={onCardClick}
              isOver={overColumnId === col.id}
              esCountMap={esCountMap}
              onESClick={onESClick}
              onCardDelete={onCardDelete}
            />
          );
        })}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activeCompany ? (
          <div className="shadow-xl rotate-1 scale-105 cursor-grabbing">
            <KanbanCard
              company={activeCompany}
              onClick={() => {}}
              isDragOverlay
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
