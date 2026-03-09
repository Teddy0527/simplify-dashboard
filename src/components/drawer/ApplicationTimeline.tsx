import { useState, useRef, useMemo } from 'react';
import {
  SelectionStage,
  SelectionStatus,
  STATUS_LABELS,
  STAGE_PRESETS,
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
import { getStageCategory, isScheduleType } from './types';
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

// STAGE_PRESETS is now imported from @jobsimplify/shared

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

  function formatDateChip(date: string, time?: string, endTime?: string) {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    if (time && endTime) return `${month}/${day} ${time}〜${endTime}`;
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
            {stage.date ? formatDateChip(stage.date, stage.time, stage.endTime) : '日付を選択'}
          </button>
          <MiniCalendar
            value={stage.date || ''}
            onChange={(d) => onUpdate({ date: d || undefined })}
            showTime
            timeValue={stage.time || ''}
            onTimeChange={(t) => onUpdate({ time: t || undefined })}
            showEndTime={isScheduleType(stage.type)}
            endTimeValue={stage.endTime || ''}
            onEndTimeChange={(t) => onUpdate({ endTime: t || undefined })}
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
  onInlineDateOpen?: (stageIdx: number, anchorEl: HTMLElement) => void;
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
  onInlineDateOpen,
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
          {/* Date — clickable chip or add button */}
          {entry.date ? (
            !isTerminal && entry.stageIndex !== undefined && onInlineDateOpen ? (
              <button
                onClick={(e) => { e.stopPropagation(); onInlineDateOpen(entry.stageIndex!, e.currentTarget); }}
                className="timeline-date-chip"
              >
                {`${parseInt(entry.date.split('-')[1])}/${parseInt(entry.date.split('-')[2])}`}
                {entry.time && entry.endTime ? ` ${entry.time}〜${entry.endTime}` : entry.time ? ` ${entry.time}` : ''}
              </button>
            ) : (
              <span className="text-xs text-gray-400">
                {`${parseInt(entry.date.split('-')[1])}/${parseInt(entry.date.split('-')[2])}`}
                {entry.time && entry.endTime ? ` ${entry.time}〜${entry.endTime}` : entry.time ? ` ${entry.time}` : ''}
              </span>
            )
          ) : (
            !isTerminal && entry.stageIndex !== undefined && onInlineDateOpen && (
              <button
                onClick={(e) => { e.stopPropagation(); onInlineDateOpen(entry.stageIndex!, e.currentTarget); }}
                className="timeline-inline-date-btn"
              >
                + 日付
              </button>
            )
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

  // Adding new stage (per section)
  const [addingSection, setAddingSection] = useState<'deadline' | 'schedule' | null>(null);
  const [newType, setNewType] = useState<SelectionStatus>('interview_1');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [addCalendarOpen, setAddCalendarOpen] = useState(false);
  const addDateTriggerRef = useRef<HTMLButtonElement>(null);

  // Inline date picker
  const [inlineDateIdx, setInlineDateIdx] = useState<number | null>(null);
  const [inlineDateAnchor, setInlineDateAnchor] = useState<HTMLElement | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Ref to avoid stale closure when multiple sync calls happen (e.g. time + endTime)
  const stagesRef = useRef(stages);
  stagesRef.current = stages;

  // Unified stage update handler
  function handleStageUpdate(stageIndex: number, patch: Partial<SelectionStage>) {
    const current = stagesRef.current;
    const updated = current.map((s, i) =>
      i === stageIndex ? { ...s, ...patch } : s,
    );
    stagesRef.current = updated;
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
      endTime: newEndTime || undefined,
      result: 'pending',
    };
    onStagesChange([...stages, stage]);
    setAddingSection(null);
    setNewType('interview_1');
    setNewDate('');
    setNewTime('');
    setNewEndTime('');
  }

  function handleInlineDateChange(date: string) {
    if (inlineDateIdx !== null) {
      handleStageUpdate(inlineDateIdx, { date: date || undefined });
    }
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

  // Categorize entries into deadline and schedule
  const deadlineEntries = entries.filter(
    (e) => e.type !== 'rejected' && e.type !== 'declined' && getStageCategory(e.type) === 'deadline',
  );
  const scheduleEntries = entries.filter(
    (e) => e.type !== 'rejected' && e.type !== 'declined' && getStageCategory(e.type) === 'schedule',
  );
  const terminalEntries = entries.filter(
    (e) => e.type === 'rejected' || e.type === 'declined',
  );

  // Sortable IDs per section
  const deadlineSortableIds = deadlineEntries
    .filter((e) => e.stageIndex !== undefined)
    .map((e) => `stage-${e.stageIndex}`);
  const scheduleSortableIds = scheduleEntries
    .filter((e) => e.stageIndex !== undefined)
    .map((e) => `stage-${e.stageIndex}`);
  // Presets per section
  const deadlinePresets = STAGE_PRESETS.filter((p) => getStageCategory(p.value) === 'deadline');
  const schedulePresets = STAGE_PRESETS.filter((p) => getStageCategory(p.value) === 'schedule');

  function renderEntryList(sectionEntries: TimelineEntry[]) {
    return sectionEntries.map((entry, i) => {
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
            onInlineDateOpen={(idx, anchorEl) => { setInlineDateIdx(idx); setInlineDateAnchor(anchorEl); }}
          />
        </div>
      );
    });
  }

  function renderAddRow(section: 'deadline' | 'schedule', presets: typeof STAGE_PRESETS) {
    if (addingSection === section) {
      return (
        <div className="flex items-center gap-2 flex-wrap mt-2 ml-6">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as SelectionStatus)}
            className="text-xs py-1 px-2 border border-gray-200 rounded bg-white"
          >
            {presets.map((s) => (
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
              ? `${parseInt(newDate.split('-')[1])}/${parseInt(newDate.split('-')[2])}${newTime && newEndTime ? ` ${newTime}〜${newEndTime}` : newTime ? ` ${newTime}` : ''}`
              : '日付'}
          </button>
          <MiniCalendar
            value={newDate}
            onChange={(d) => setNewDate(d)}
            showTime
            timeValue={newTime}
            onTimeChange={(t) => setNewTime(t)}
            showEndTime={section === 'schedule'}
            endTimeValue={newEndTime}
            onEndTimeChange={(t) => setNewEndTime(t)}
            anchorRef={addDateTriggerRef}
            open={addCalendarOpen}
            onClose={() => setAddCalendarOpen(false)}
          />
          <button onClick={handleAddStage} className="text-xs py-1 px-2 bg-primary-700 text-white rounded">
            追加
          </button>
          <button onClick={() => setAddingSection(null)} className="text-xs py-1 px-2 text-gray-500">
            取消
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={() => {
          setAddingSection(section);
          setNewType(presets[0]?.value || 'interview_1');
          setNewDate('');
          setNewTime('');
        }}
        className="text-xs text-primary-600 hover:text-primary-800 transition-colors mt-2 ml-6"
      >
        + {section === 'deadline' ? '締切を追加' : '選考を追加'}
      </button>
    );
  }

  // Inline date MiniCalendar (positioned via clicked anchor element)
  const inlineDateAnchorRef = useMemo(
    () => ({ current: inlineDateAnchor }),
    [inlineDateAnchor],
  );
  const inlineStageIsSchedule = inlineDateIdx !== null && stages[inlineDateIdx]
    ? isScheduleType(stages[inlineDateIdx].type)
    : false;
  const inlineDateTriggerEl = inlineDateIdx !== null ? (
    <MiniCalendar
      value={stages[inlineDateIdx]?.date || ''}
      onChange={handleInlineDateChange}
      anchorRef={inlineDateAnchorRef}
      open={inlineDateIdx !== null}
      onClose={() => { setInlineDateIdx(null); setInlineDateAnchor(null); }}
      showTime
      timeValue={stages[inlineDateIdx]?.time || ''}
      onTimeChange={(t) => inlineDateIdx !== null && handleStageUpdate(inlineDateIdx, { time: t || undefined })}
      showEndTime={inlineStageIsSchedule}
      endTimeValue={stages[inlineDateIdx]?.endTime || ''}
      onEndTimeChange={(t) => inlineDateIdx !== null && handleStageUpdate(inlineDateIdx, { endTime: t || undefined })}
    />
  ) : null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800 mb-3 tracking-wide">選考タイムライン</h3>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {/* Deadline section */}
        {(deadlineEntries.length > 0 || addingSection === 'deadline') && (
          <div className="timeline-section mb-4">
            <div className="timeline-section-header">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              締切
            </div>
            <SortableContext items={deadlineSortableIds} strategy={verticalListSortingStrategy}>
              <div className="relative pl-6">
                {deadlineEntries.length > 1 && (
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />
                )}
                {renderEntryList(deadlineEntries)}
              </div>
            </SortableContext>
            {renderAddRow('deadline', deadlinePresets)}
          </div>
        )}

        {/* Schedule section */}
        {(scheduleEntries.length > 0 || addingSection === 'schedule') && (
          <div className="timeline-section mb-4">
            <div className="timeline-section-header">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              選考
            </div>
            <SortableContext items={scheduleSortableIds} strategy={verticalListSortingStrategy}>
              <div className="relative pl-6">
                {scheduleEntries.length > 1 && (
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />
                )}
                {renderEntryList(scheduleEntries)}
              </div>
            </SortableContext>
            {renderAddRow('schedule', schedulePresets)}
          </div>
        )}

        {/* Fallback: if no deadline/schedule entries exist, show both add buttons */}
        {deadlineEntries.length === 0 && scheduleEntries.length === 0 && addingSection === null && (
          <div className="space-y-3">
            <div className="timeline-section">
              <div className="timeline-section-header">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                締切
              </div>
              <SortableContext items={[]} strategy={verticalListSortingStrategy}>
                <div className="relative pl-6" />
              </SortableContext>
              {renderAddRow('deadline', deadlinePresets)}
            </div>
            <div className="timeline-section">
              <div className="timeline-section-header">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                選考
              </div>
              <SortableContext items={[]} strategy={verticalListSortingStrategy}>
                <div className="relative pl-6" />
              </SortableContext>
              {renderAddRow('schedule', schedulePresets)}
            </div>
          </div>
        )}

        {/* Terminal entries (rejected/declined) */}
        {terminalEntries.length > 0 && (
          <SortableContext items={[]} strategy={verticalListSortingStrategy}>
            <div className="relative pl-6 mt-2">
              {renderEntryList(terminalEntries)}
            </div>
          </SortableContext>
        )}
      </DndContext>

      {inlineDateTriggerEl}

      {stages.length > 3 && (
        <div className="mt-3">
          <button
            onClick={onToggleShowAll}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showAll ? '折りたたむ' : 'すべて表示'}
          </button>
        </div>
      )}
    </div>
  );
}
