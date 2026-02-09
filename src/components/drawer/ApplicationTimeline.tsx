import { useState, useRef, useEffect } from 'react';
import { SelectionStage, SelectionStatus, STATUS_LABELS } from '@jobsimplify/shared';
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

interface ApplicationTimelineProps {
  entries: TimelineEntry[];
  stages: SelectionStage[];
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

// --- Sortable timeline item ---

interface SortableTimelineItemProps {
  id: string;
  entry: TimelineEntry;
  isEditing: boolean;
  isEditingLabel: boolean;
  editLabelValue: string;
  editResult: 'pending' | 'passed' | 'failed';
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemoveStage: () => void;
  onStartLabelEdit: () => void;
  onLabelChange: (v: string) => void;
  onLabelSave: () => void;
  onEditResultChange: (v: 'pending' | 'passed' | 'failed') => void;
  isTerminal: boolean;
  onDotClick: () => void;
  isEditingDate: boolean;
  editDateValue: string;
  onDateClick: () => void;
  onDateSave: (value: string) => void;
}

function SortableTimelineItem({
  id,
  entry,
  isEditing,
  isEditingLabel,
  editLabelValue,
  editResult,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRemoveStage,
  onStartLabelEdit,
  onLabelChange,
  onLabelSave,
  onEditResultChange,
  isTerminal,
  onDotClick,
  isEditingDate,
  editDateValue,
  onDateClick,
  onDateSave,
}: SortableTimelineItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isTerminal });

  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [isEditingLabel]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  function handleLabelKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onLabelSave();
    } else if (e.key === 'Escape') {
      onLabelSave();
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex items-start gap-3 mb-4 last:mb-0 group"
    >
      {/* Drag handle — hover only, left of dot */}
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
          {/* Label — click to edit */}
          {isEditingLabel ? (
            <input
              ref={labelInputRef}
              type="text"
              value={editLabelValue}
              onChange={(e) => onLabelChange(e.target.value)}
              onBlur={onLabelSave}
              onKeyDown={handleLabelKeyDown}
              className="text-sm font-medium text-gray-900 bg-white border border-primary-300 rounded px-1 py-0 outline-none focus:ring-1 focus:ring-primary-400 w-24"
            />
          ) : (
            <span
              className={`text-sm font-medium text-gray-900 ${entry.stageIndex !== undefined ? 'cursor-pointer hover:text-primary-600' : ''}`}
              onClick={() => {
                if (entry.stageIndex !== undefined) onStartLabelEdit();
              }}
              title={entry.stageIndex !== undefined ? 'クリックで名前変更' : undefined}
            >
              {entry.label}
            </span>
          )}
          {entry.stageIndex !== undefined && (
            isEditingDate ? (
              <input
                type="date"
                autoFocus
                defaultValue={editDateValue}
                onBlur={(e) => onDateSave(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onDateSave((e.target as HTMLInputElement).value);
                  }
                }}
                className="text-xs py-0 px-1 border border-primary-300 rounded bg-white outline-none focus:ring-1 focus:ring-primary-400"
              />
            ) : (
              <span
                className="text-xs text-gray-400 cursor-pointer hover:text-primary-500 transition-colors"
                onClick={onDateClick}
                title="クリックで日付入力"
              >
                {entry.date
                  ? `${parseInt(entry.date.split('-')[1])}/${parseInt(entry.date.split('-')[2])}${entry.time ? ` ${entry.time}` : ''}`
                  : '日付'}
              </span>
            )
          )}
          {entry.stageIndex === undefined && entry.date && (
            <span className="text-xs text-gray-400">
              {entry.date}
              {entry.time && ` ${entry.time}`}
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
        </div>

        {isEditing && entry.stageIndex !== undefined && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <select
                value={editResult}
                onChange={(e) => onEditResultChange(e.target.value as 'pending' | 'passed' | 'failed')}
                className="text-xs py-1 px-2 border border-gray-200 rounded bg-white"
              >
                {Object.entries(RESULT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <button
                onClick={onSaveEdit}
                className="text-xs py-1 px-2 bg-primary-700 text-white rounded"
              >
                保存
              </button>
              <button
                onClick={onCancelEdit}
                className="text-xs py-1 px-2 text-gray-500 hover:text-gray-700"
              >
                取消
              </button>
              <button
                onClick={onRemoveStage}
                className="text-xs py-1 px-2 text-error-500 hover:text-error-700 ml-auto"
              >
                削除
              </button>
            </div>
          </div>
        )}

        {/* Edit icon */}
        {!isEditing && entry.stageIndex !== undefined && (
          <button
            onClick={onStartEdit}
            className="mt-0.5 text-gray-400 hover:text-primary-600 transition-colors"
            title="編集"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// --- Main component ---

export default function ApplicationTimeline({
  entries,
  stages,
  showAll,
  onToggleShowAll,
  onStagesChange,
}: ApplicationTimelineProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editResult, setEditResult] = useState<'pending' | 'passed' | 'failed'>('pending');

  // Label editing
  const [editingLabelIdx, setEditingLabelIdx] = useState<number | null>(null);
  const [editLabelValue, setEditLabelValue] = useState('');

  // Inline date editing
  const [editingDateIdx, setEditingDateIdx] = useState<number | null>(null);

  // Adding new stage
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState<SelectionStatus>('interview_1');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleStartEdit(entry: TimelineEntry) {
    if (entry.stageIndex !== undefined) {
      const stage = stages[entry.stageIndex];
      setEditingIdx(entry.stageIndex);
      setEditResult(stage.result || 'pending');
    }
  }

  function handleSaveEdit() {
    if (editingIdx === null) return;
    const updated = stages.map((s, i) =>
      i === editingIdx ? { ...s, result: editResult } : s,
    );
    onStagesChange(updated);
    setEditingIdx(null);
  }

  function handleCancelEdit() {
    setEditingIdx(null);
  }

  function handleRemoveStage(stageIndex: number) {
    onStagesChange(stages.filter((_, i) => i !== stageIndex));
    if (editingIdx === stageIndex) setEditingIdx(null);
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

  // Label editing handlers
  function handleStartLabelEdit(entry: TimelineEntry) {
    if (entry.stageIndex === undefined) return;
    setEditingLabelIdx(entry.stageIndex);
    const stage = stages[entry.stageIndex];
    setEditLabelValue(stage.customLabel || (STATUS_LABELS[stage.type] ?? stage.type));
  }

  function handleSaveLabelEdit() {
    if (editingLabelIdx === null) return;
    const stage = stages[editingLabelIdx];
    const defaultLabel = STATUS_LABELS[stage.type] ?? stage.type;
    const customLabel = editLabelValue.trim() === '' || editLabelValue.trim() === defaultLabel
      ? undefined
      : editLabelValue.trim();
    const updated = stages.map((s, i) =>
      i === editingLabelIdx ? { ...s, customLabel } : s,
    );
    onStagesChange(updated);
    setEditingLabelIdx(null);
  }

  // Dot click handler — advance or revert progression
  function handleDotClick(clickedIdx: number) {
    const stage = stages[clickedIdx];
    if (!stage || stage.result === 'failed') return;

    const updated = stages.map((s, i) => {
      if (s.type === 'rejected' || s.type === 'declined') return s;

      if (stage.result === 'passed') {
        // Clicking a passed stage → revert: keep 0..clickedIdx-1 as-is, clickedIdx becomes pending, rest undefined
        if (i < clickedIdx) return s;
        if (i === clickedIdx) return { ...s, result: 'pending' as const };
        return { ...s, result: undefined };
      } else {
        // Clicking a future/pending/undefined stage → advance
        if (i < clickedIdx) return { ...s, result: 'passed' as const };
        if (i === clickedIdx) return { ...s, result: 'pending' as const };
        return { ...s, result: undefined };
      }
    });
    onStagesChange(updated);
  }

  // Inline date save
  function handleDateSave(stageIndex: number, value: string) {
    const updated = stages.map((s, i) =>
      i === stageIndex ? { ...s, date: value || undefined } : s,
    );
    onStagesChange(updated);
    setEditingDateIdx(null);
  }

  // DnD handler
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Reset editing states
    setEditingIdx(null);
    setEditingLabelIdx(null);

    // Find sortable entries (non-terminal)
    const sortableEntries = entries.filter(
      (e) => e.type !== 'rejected' && e.type !== 'declined' && e.stageIndex !== undefined,
    );

    const oldIdx = sortableEntries.findIndex((e) => `stage-${e.stageIndex}` === active.id);
    const newIdx = sortableEntries.findIndex((e) => `stage-${e.stageIndex}` === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    const oldStageIdx = sortableEntries[oldIdx].stageIndex!;
    const newStageIdx = sortableEntries[newIdx].stageIndex!;

    // Map to stages array indices
    const stageIndices = sortableEntries.map((e) => e.stageIndex!);
    const fromPos = stageIndices.indexOf(oldStageIdx);
    const toPos = stageIndices.indexOf(newStageIdx);
    const reorderedIndices = arrayMove(stageIndices, fromPos, toPos);

    // Build new stages array preserving non-sortable items in place
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
              const isEditing = entry.stageIndex !== undefined && editingIdx === entry.stageIndex;
              const isEditingLabel = entry.stageIndex !== undefined && editingLabelIdx === entry.stageIndex;

              return (
                <SortableTimelineItem
                  key={`${entry.type}-${i}`}
                  id={itemId}
                  entry={entry}
                  isEditing={isEditing}
                  isEditingLabel={isEditingLabel}
                  editLabelValue={editLabelValue}
                  editResult={editResult}
                  onStartEdit={() => handleStartEdit(entry)}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onRemoveStage={() => entry.stageIndex !== undefined && handleRemoveStage(entry.stageIndex)}
                  onStartLabelEdit={() => handleStartLabelEdit(entry)}
                  onLabelChange={setEditLabelValue}
                  onLabelSave={handleSaveLabelEdit}
                  onEditResultChange={setEditResult}
                  isTerminal={isTerminal}
                  onDotClick={() => entry.stageIndex !== undefined && handleDotClick(entry.stageIndex)}
                  isEditingDate={entry.stageIndex !== undefined && editingDateIdx === entry.stageIndex}
                  editDateValue={entry.stageIndex !== undefined && editingDateIdx === entry.stageIndex ? (stages[entry.stageIndex].date || '') : ''}
                  onDateClick={() => entry.stageIndex !== undefined && setEditingDateIdx(entry.stageIndex)}
                  onDateSave={(value) => entry.stageIndex !== undefined && handleDateSave(entry.stageIndex, value)}
                />
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
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="text-xs py-1 px-2 border border-gray-200 rounded bg-white"
            />
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="text-xs py-1 px-2 border border-gray-200 rounded bg-white"
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
