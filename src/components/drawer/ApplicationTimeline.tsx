import { useState, useRef } from 'react';
import {
  SelectionStage,
  SelectionStatus,
  STATUS_LABELS,
} from '@jobsimplify/shared';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TimelineEntry, TimelineEntryState } from './types';
import MiniCalendar from '../ui/MiniCalendar';

interface ApplicationTimelineProps {
  entries: TimelineEntry[];
  stages: SelectionStage[];
  companyName: string;
  showAll: boolean;
  onToggleShowAll: () => void;
  onStagesChange: (stages: SelectionStage[]) => void;
}

const RESULT_LABELS: Record<string, string> = {
  passed: '合格',
  failed: '不合格',
  pending: '結果待ち',
};

const STAGE_PRESETS: { value: SelectionStatus; label: string }[] = [
  { value: 'es_submitted', label: 'ES提出' },
  { value: 'webtest', label: 'Webテスト' },
  { value: 'gd', label: 'GD' },
  { value: 'interview_1', label: '1次面接' },
  { value: 'interview_2', label: '2次面接' },
  { value: 'interview_3', label: '3次面接' },
  { value: 'interview_final', label: '最終面接' },
  { value: 'offer', label: '内定' },
];

const DOT_CLASSES: Record<TimelineEntryState, string> = {
  passed: 'bg-primary-700',
  current: 'bg-success-600 ring-2 ring-success-600/30',
  pending: 'bg-warning-500',
  failed: 'bg-error-500',
  future: 'border-2 border-gray-300 bg-white',
};

// --- Three-dot menu button ---

function MoreButton({ onClick, title }: { onClick: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      className="p-1 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover/dl:opacity-100 group-hover:opacity-100"
      title={title || '詳細'}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="5" r="2.4" />
        <circle cx="12" cy="12" r="2.4" />
        <circle cx="12" cy="19" r="2.4" />
      </svg>
    </button>
  );
}

// --- Stage expanded edit panel ---

function StageEditPanel({
  stage,
  onUpdate,
  onRemove,
  onClose,
}: {
  stage: SelectionStage;
  onUpdate: (patch: Partial<SelectionStage>) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const [labelValue, setLabelValue] = useState(
    stage.customLabel || (STATUS_LABELS[stage.type] ?? stage.type),
  );
  const [calOpen, setCalOpen] = useState(false);
  const dateTriggerRef = useRef<HTMLButtonElement>(null);

  function handleLabelBlur() {
    const defaultLabel = STATUS_LABELS[stage.type] ?? stage.type;
    const customLabel =
      labelValue.trim() === '' || labelValue.trim() === defaultLabel
        ? undefined
        : labelValue.trim();
    onUpdate({ customLabel });
  }

  function handleLabelKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  }

  function formatDateChip(date: string, time?: string) {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${month}/${day}${time ? ` ${time}` : ''}`;
  }

  return (
    <div className="mt-2 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 space-y-2.5">
        {/* Label */}
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <input
            type="text"
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onBlur={handleLabelBlur}
            onKeyDown={handleLabelKeyDown}
            className="flex-1 text-sm font-medium text-gray-900 border-b border-gray-200 focus:border-primary-500 outline-none pb-1 bg-transparent placeholder:text-gray-400"
            placeholder="ステージ名..."
          />
        </div>

        {/* Date */}
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <button
            ref={dateTriggerRef}
            type="button"
            onClick={() => setCalOpen(true)}
            className={`text-sm px-3 py-1 rounded-full transition-colors ${
              stage.date
                ? 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            {stage.date ? formatDateChip(stage.date, stage.time) : '日付を選択'}
          </button>
          <MiniCalendar
            value={stage.date || ''}
            onChange={(d) => onUpdate({ date: d || undefined })}
            anchorRef={dateTriggerRef}
            open={calOpen}
            onClose={() => setCalOpen(false)}
          />
        </div>

        {/* Result */}
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </svg>
          <select
            value={stage.result || 'pending'}
            onChange={(e) => onUpdate({ result: e.target.value as 'pending' | 'passed' | 'failed' })}
            className="text-sm py-1 px-2 rounded bg-gray-50 border-0 text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors focus:ring-1 focus:ring-primary-400 outline-none"
          >
            {Object.entries(RESULT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Footer */}
        <div className="flex items-center pt-1">
          <button
            onClick={onRemove}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            削除
          </button>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors ml-auto"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Sortable timeline item ---

interface SortableTimelineItemProps {
  id: string;
  entry: TimelineEntry;
  stage?: SelectionStage;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStageUpdate: (patch: Partial<SelectionStage>) => void;
  onRemoveStage: () => void;
  isTerminal: boolean;
  onDotClick: () => void;
}

function SortableTimelineItem({
  id,
  entry,
  stage,
  isExpanded,
  onToggleExpand,
  onStageUpdate,
  onRemoveStage,
  isTerminal,
  onDotClick,
}: SortableTimelineItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isTerminal });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex items-start gap-3 mb-4 last:mb-0 group"
    >
      {/* Drag handle */}
      {!isTerminal && entry.stageIndex !== undefined && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-10 top-0.5 w-4 h-4 flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab transition-opacity"
          title="ドラッグで並べ替え"
        >
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
            <circle cx="3" cy="2" r="1.2" />
            <circle cx="7" cy="2" r="1.2" />
            <circle cx="3" cy="7" r="1.2" />
            <circle cx="7" cy="7" r="1.2" />
            <circle cx="3" cy="12" r="1.2" />
            <circle cx="7" cy="12" r="1.2" />
          </svg>
        </div>
      )}

      {/* Dot */}
      {(() => {
        const canClick = !isTerminal && entry.stageIndex !== undefined && entry.state !== 'failed';
        return (
          <div
            className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full flex-shrink-0 transition-transform ${DOT_CLASSES[entry.state]} ${canClick ? 'cursor-pointer hover:scale-125' : ''}`}
            onClick={canClick ? onDotClick : undefined}
            title={canClick ? 'クリックで進行/取り消し' : undefined}
          />
        );
      })()}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Label — display only */}
          <span className="text-sm font-medium text-gray-900">
            {entry.label}
          </span>
          {/* Date — display only */}
          {entry.date && (
            <span className="text-xs text-gray-400">
              {`${parseInt(entry.date.split('-')[1])}/${parseInt(entry.date.split('-')[2])}`}
              {entry.time ? ` ${entry.time}` : ''}
            </span>
          )}
          {entry.result && (
            <span className={`text-xs font-medium ${
              entry.result === 'passed' ? 'text-success-600'
                : entry.result === 'failed' ? 'text-error-500'
                : 'text-warning-500'
            }`}>
              {RESULT_LABELS[entry.result]}
            </span>
          )}
          {/* More button */}
          {!isTerminal && entry.stageIndex !== undefined && (
            <div className="ml-auto flex-shrink-0">
              <MoreButton onClick={onToggleExpand} title="ステージを編集" />
            </div>
          )}
        </div>

        {/* Expanded edit panel */}
        {isExpanded && stage && (
          <StageEditPanel
            stage={stage}
            onUpdate={onStageUpdate}
            onRemove={onRemoveStage}
            onClose={onToggleExpand}
          />
        )}
      </div>
    </div>
  );
}

// --- Main component ---

export default function ApplicationTimeline({
  entries,
  stages,
  companyName: _companyName,
  showAll,
  onToggleShowAll,
  onStagesChange,
}: ApplicationTimelineProps) {
  // Expanded stage panel
  const [expandedStageIdx, setExpandedStageIdx] = useState<number | null>(null);

  // Adding new stage
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState<SelectionStatus>('interview_1');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [addCalendarOpen, setAddCalendarOpen] = useState(false);
  const addDateTriggerRef = useRef<HTMLButtonElement>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Unified stage update handler
  function handleStageUpdate(stageIndex: number, patch: Partial<SelectionStage>) {
    const updated = stages.map((s, i) =>
      i === stageIndex ? { ...s, ...patch } : s,
    );
    onStagesChange(updated);
  }

  function handleRemoveStage(stageIndex: number) {
    onStagesChange(stages.filter((_, i) => i !== stageIndex));
    if (expandedStageIdx === stageIndex) setExpandedStageIdx(null);
  }

  function handleAddStage() {
    const stage: SelectionStage = {
      type: newType,
      date: newDate || undefined,
      time: newTime || undefined,
      result: 'pending',
    };
    onStagesChange([...stages, stage]);
    setAdding(false);
    setNewType('interview_1');
    setNewDate('');
    setNewTime('');
  }

  // Dot click handler — advance or revert progression
  function handleDotClick(clickedIdx: number) {
    const stage = stages[clickedIdx];
    if (!stage || stage.result === 'failed') return;

    const updated = stages.map((s, i) => {
      if (s.type === 'rejected' || s.type === 'declined') return s;

      if (stage.result === 'passed') {
        if (i < clickedIdx) return s;
        if (i === clickedIdx) return { ...s, result: 'pending' as const };
        return { ...s, result: undefined };
      } else {
        if (i < clickedIdx) return { ...s, result: 'passed' as const };
        if (i === clickedIdx) return { ...s, result: 'pending' as const };
        return { ...s, result: undefined };
      }
    });
    onStagesChange(updated);
  }

  // DnD handler
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setExpandedStageIdx(null);

    const sortableEntries = entries.filter(
      (e) => e.type !== 'rejected' && e.type !== 'declined' && e.stageIndex !== undefined,
    );

    const oldIdx = sortableEntries.findIndex((e) => `stage-${e.stageIndex}` === active.id);
    const newIdx = sortableEntries.findIndex((e) => `stage-${e.stageIndex}` === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    const oldStageIdx = sortableEntries[oldIdx].stageIndex!;
    const newStageIdx = sortableEntries[newIdx].stageIndex!;

    const stageIndices = sortableEntries.map((e) => e.stageIndex!);
    const fromPos = stageIndices.indexOf(oldStageIdx);
    const toPos = stageIndices.indexOf(newStageIdx);
    const reorderedIndices = arrayMove(stageIndices, fromPos, toPos);

    const newStages = [...stages];
    const sortableStages = reorderedIndices.map((idx) => stages[idx]);
    let sortIdx = 0;
    for (let i = 0; i < newStages.length; i++) {
      if (stageIndices.includes(i)) {
        newStages[i] = sortableStages[sortIdx++];
      }
    }

    onStagesChange(newStages);
  }

  // Build sortable IDs (exclude terminal entries)
  const sortableEntries = entries.filter(
    (e) => e.type !== 'rejected' && e.type !== 'declined' && e.stageIndex !== undefined,
  );
  const sortableIds = sortableEntries.map((e) => `stage-${e.stageIndex}`);

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800 mb-3 tracking-wide">選考タイムライン</h3>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="relative pl-6">
            {/* Vertical connection line */}
            {entries.length > 1 && (
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />
            )}

            {entries.map((entry, i) => {
              const isTerminal = entry.type === 'rejected' || entry.type === 'declined';
              const itemId = isTerminal ? `terminal-${entry.type}` : `stage-${entry.stageIndex}`;
              const stage = entry.stageIndex !== undefined ? stages[entry.stageIndex] : undefined;

              return (
                <div key={`${entry.type}-${i}`}>
                  <SortableTimelineItem
                    id={itemId}
                    entry={entry}
                    stage={stage}
                    isExpanded={entry.stageIndex !== undefined && expandedStageIdx === entry.stageIndex}
                    onToggleExpand={() => {
                      if (entry.stageIndex !== undefined) {
                        setExpandedStageIdx(expandedStageIdx === entry.stageIndex ? null : entry.stageIndex);
                      }
                    }}
                    onStageUpdate={(patch) => entry.stageIndex !== undefined && handleStageUpdate(entry.stageIndex, patch)}
                    onRemoveStage={() => entry.stageIndex !== undefined && handleRemoveStage(entry.stageIndex)}
                    isTerminal={isTerminal}
                    onDotClick={() => entry.stageIndex !== undefined && handleDotClick(entry.stageIndex)}
                  />
                </div>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex items-center gap-3 mt-3">
        {stages.length > 3 && (
          <button
            onClick={onToggleShowAll}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showAll ? '折りたたむ' : 'すべて表示'}
          </button>
        )}

        {adding ? (
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as SelectionStatus)}
              className="text-xs py-1 px-2 border border-gray-200 rounded bg-white"
            >
              {STAGE_PRESETS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <button
              ref={addDateTriggerRef}
              type="button"
              onClick={() => setAddCalendarOpen(true)}
              className="text-xs py-1 px-2 border border-gray-200 rounded bg-white hover:border-gray-300 transition-colors text-left min-w-[80px]"
            >
              {newDate
                ? `${parseInt(newDate.split('-')[1])}/${parseInt(newDate.split('-')[2])}${newTime ? ` ${newTime}` : ''}`
                : '日付'}
            </button>
            <MiniCalendar
              value={newDate}
              onChange={(d) => setNewDate(d)}
              showTime
              timeValue={newTime}
              onTimeChange={(t) => setNewTime(t)}
              anchorRef={addDateTriggerRef}
              open={addCalendarOpen}
              onClose={() => setAddCalendarOpen(false)}
            />
            <button onClick={handleAddStage} className="text-xs py-1 px-2 bg-primary-700 text-white rounded">
              追加
            </button>
            <button onClick={() => setAdding(false)} className="text-xs py-1 px-2 text-gray-500">
              取消
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="text-xs text-primary-600 hover:text-primary-800 transition-colors"
          >
            + ステージ追加
          </button>
        )}
      </div>
    </div>
  );
}
