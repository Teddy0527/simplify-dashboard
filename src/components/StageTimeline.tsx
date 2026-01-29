import { useState } from 'react';
import { SelectionStage, SelectionStatus, STATUS_LABELS } from '../shared/types';

interface StageTimelineProps {
  stages: SelectionStage[];
  currentStatus: SelectionStatus;
  onStagesChange: (stages: SelectionStage[]) => void;
}

const RESULT_COLORS: Record<string, string> = {
  passed: 'bg-[var(--color-sage-600)]',
  failed: 'bg-[var(--color-vermillion-500)]',
  pending: 'bg-[var(--color-gold-500)]',
};

const RESULT_LABELS: Record<string, string> = {
  passed: '合格',
  failed: '不合格',
  pending: '結果待ち',
};

const STAGE_OPTIONS: SelectionStatus[] = [
  'applied', 'es_submitted', 'webtest', 'gd',
  'interview_1', 'interview_2', 'interview_3', 'interview_final',
  'offer',
];

export default function StageTimeline({ stages, onStagesChange }: StageTimelineProps) {
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState<SelectionStatus>('interview_1');
  const [newDate, setNewDate] = useState('');

  function handleAdd() {
    const stage: SelectionStage = {
      type: newType,
      date: newDate || undefined,
      result: 'pending',
    };
    onStagesChange([...stages, stage]);
    setAdding(false);
    setNewType('interview_1');
    setNewDate('');
  }

  function handleRemove(index: number) {
    onStagesChange(stages.filter((_, i) => i !== index));
  }

  function handleResultChange(index: number, result: 'pending' | 'passed' | 'failed') {
    const updated = stages.map((s, i) => (i === index ? { ...s, result } : s));
    onStagesChange(updated);
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--color-navy-800)] mb-3 tracking-wide">選考タイムライン</h3>

      {stages.length === 0 && !adding ? (
        <p className="text-xs text-[var(--color-navy-400)] mb-2">ステージがまだありません</p>
      ) : (
        <div className="relative pl-5 mb-2">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-[var(--color-navy-200)]" />

          {stages.map((stage, i) => {
            const color = stage.result ? RESULT_COLORS[stage.result] : 'bg-[var(--color-navy-300)]';
            return (
              <div key={i} className="relative flex items-start gap-3 mb-4 last:mb-0">
                {/* Dot */}
                <div className={`absolute -left-5 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${color}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--color-navy-900)]">
                      {STATUS_LABELS[stage.type]}
                    </span>
                    {stage.date && (
                      <span className="text-xs text-[var(--color-navy-400)]">{stage.date}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      value={stage.result ?? 'pending'}
                      onChange={(e) => handleResultChange(i, e.target.value as 'pending' | 'passed' | 'failed')}
                      className="text-xs py-0.5 px-1 border border-[var(--color-navy-200)] bg-white"
                    >
                      {Object.entries(RESULT_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRemove(i)}
                      className="text-xs text-[var(--color-navy-400)] hover:text-[var(--color-vermillion-500)] transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {adding ? (
        <div className="flex items-end gap-2 mt-2">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as SelectionStatus)}
            className="text-sm py-1.5 px-2 border border-[var(--color-navy-200)] bg-white"
          >
            {STAGE_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="text-sm py-1.5 px-2 border border-[var(--color-navy-200)] bg-white"
          />
          <button onClick={handleAdd} className="text-sm py-1.5 px-3 bg-[var(--color-navy-800)] text-white">追加</button>
          <button onClick={() => setAdding(false)} className="text-sm py-1.5 px-3 text-[var(--color-navy-600)]">取消</button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="text-xs text-[var(--color-navy-600)] hover:text-[var(--color-navy-800)] transition-colors"
        >
          + ステージ追加
        </button>
      )}
    </div>
  );
}
