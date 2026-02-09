import { useState } from 'react';
import {
  CompanyDeadline,
  DeadlineType,
  DEADLINE_TYPE_LABELS,
  createDeadline,
} from '@entrify/shared';
import { getDeadlineUrgency, formatDeadlineShort } from '../utils/deadlineHelpers';
import { buildGoogleCalendarUrl } from '../utils/googleCalendar';

interface DeadlineManagerProps {
  deadlines: CompanyDeadline[];
  companyName: string;
  onDeadlinesChange: (deadlines: CompanyDeadline[]) => void;
}

const DEADLINE_TYPES: DeadlineType[] = [
  'es_submission', 'internship', 'webtest', 'interview',
  'offer_response', 'document', 'event', 'other',
];

const URGENCY_BORDER: Record<string, string> = {
  overdue: 'border-l-red-500 bg-red-50/50',
  urgent: 'border-l-red-500 bg-red-50/50',
  soon: 'border-l-amber-500 bg-amber-50/50',
  normal: 'border-l-gray-300',
};

export default function DeadlineManager({ deadlines, companyName, onDeadlinesChange }: DeadlineManagerProps) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Add form state
  const [newType, setNewType] = useState<DeadlineType>('es_submission');
  const [newLabel, setNewLabel] = useState(DEADLINE_TYPE_LABELS['es_submission']);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newMemo, setNewMemo] = useState('');

  // Edit form state
  const [editType, setEditType] = useState<DeadlineType>('es_submission');
  const [editLabel, setEditLabel] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editMemo, setEditMemo] = useState('');

  const sorted = [...deadlines].sort((a, b) => a.date.localeCompare(b.date));

  function handleTypeChange(type: DeadlineType) {
    setNewType(type);
    setNewLabel(DEADLINE_TYPE_LABELS[type]);
  }

  function handleAdd() {
    if (!newDate) return;
    const deadline = createDeadline(newType, newLabel, newDate, newTime || undefined, newMemo || undefined);
    onDeadlinesChange([...deadlines, deadline]);
    resetAddForm();
  }

  function resetAddForm() {
    setAdding(false);
    setNewType('es_submission');
    setNewLabel(DEADLINE_TYPE_LABELS['es_submission']);
    setNewDate('');
    setNewTime('');
    setNewMemo('');
  }

  function handleStartEdit(d: CompanyDeadline) {
    setEditingId(d.id);
    setEditType(d.type);
    setEditLabel(d.label);
    setEditDate(d.date);
    setEditTime(d.time || '');
    setEditMemo(d.memo || '');
  }

  function handleEditTypeChange(type: DeadlineType) {
    setEditType(type);
    setEditLabel(DEADLINE_TYPE_LABELS[type]);
  }

  function handleSaveEdit() {
    if (!editDate || !editingId) return;
    onDeadlinesChange(
      deadlines.map(d =>
        d.id === editingId
          ? { ...d, type: editType, label: editLabel, date: editDate, time: editTime || undefined, memo: editMemo || undefined }
          : d,
      ),
    );
    setEditingId(null);
  }

  function handleDelete(id: string) {
    onDeadlinesChange(deadlines.filter(d => d.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function handleGoogleCalendar(d: CompanyDeadline) {
    const url = buildGoogleCalendarUrl(companyName, d);
    window.open(url, '_blank');
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800 mb-3 tracking-wide">締切・スケジュール</h3>

      {sorted.length === 0 && !adding ? (
        <p className="text-xs text-gray-400 mb-2">締切がまだありません</p>
      ) : (
        <div className="space-y-2 mb-2">
          {sorted.map(d => {
            const urgency = getDeadlineUrgency(d.date);
            const isEditing = editingId === d.id;

            if (isEditing) {
              return (
                <div key={d.id} className="p-3 border border-primary-300 rounded-lg bg-primary-50/30 space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={editType}
                      onChange={e => handleEditTypeChange(e.target.value as DeadlineType)}
                      className="text-sm py-1.5 px-2 border border-gray-200 rounded-lg bg-white flex-shrink-0"
                    >
                      {DEADLINE_TYPES.map(t => (
                        <option key={t} value={t}>{DEADLINE_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      className="text-sm py-1.5 px-2 border border-gray-200 rounded-lg bg-white flex-1 min-w-0"
                      placeholder="ラベル"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={editDate}
                      onChange={e => setEditDate(e.target.value)}
                      className="text-sm py-1.5 px-2 border border-gray-200 rounded-lg bg-white"
                    />
                    <input
                      type="time"
                      value={editTime}
                      onChange={e => setEditTime(e.target.value)}
                      className="text-sm py-1.5 px-2 border border-gray-200 rounded-lg bg-white"
                    />
                  </div>
                  <input
                    type="text"
                    value={editMemo}
                    onChange={e => setEditMemo(e.target.value)}
                    className="text-sm py-1.5 px-2 border border-gray-200 rounded-lg bg-white w-full"
                    placeholder="メモ（任意）"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveEdit} className="text-sm py-1 px-3 bg-primary-700 text-white rounded-lg">保存</button>
                    <button onClick={() => setEditingId(null)} className="text-sm py-1 px-3 text-gray-600 rounded-lg">取消</button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={d.id}
                className={`p-2.5 border border-gray-200 rounded-lg border-l-4 ${URGENCY_BORDER[urgency]}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{d.label}</span>
                      {d.isPreset && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">自動</span>
                      )}
                      <span className={`text-xs font-medium ${
                        urgency === 'overdue' || urgency === 'urgent' ? 'text-red-600'
                          : urgency === 'soon' ? 'text-amber-600'
                          : 'text-gray-500'
                      }`}>
                        {formatDeadlineShort(d.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-gray-400">{d.date}</span>
                      {d.time && <span className="text-xs text-gray-400">{d.time}</span>}
                    </div>
                    {d.memo && (
                      <p className="text-xs text-gray-500 mt-1">{d.memo}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleStartEdit(d)}
                      className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                      title="編集"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="削除"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => handleGoogleCalendar(d)}
                  className="mt-1.5 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Googleカレンダーに追加
                </button>
              </div>
            );
          })}
        </div>
      )}

      {adding ? (
        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50/50 space-y-2">
          <div className="flex gap-2">
            <select
              value={newType}
              onChange={e => handleTypeChange(e.target.value as DeadlineType)}
              className="text-sm py-1.5 px-2 border border-gray-200 rounded-lg bg-white flex-shrink-0"
            >
              {DEADLINE_TYPES.map(t => (
                <option key={t} value={t}>{DEADLINE_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              className="text-sm py-1.5 px-2 border border-gray-200 rounded-lg bg-white flex-1 min-w-0"
              placeholder="ラベル"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="text-sm py-1.5 px-2 border border-gray-200 rounded-lg bg-white"
            />
            <input
              type="time"
              value={newTime}
              onChange={e => setNewTime(e.target.value)}
              className="text-sm py-1.5 px-2 border border-gray-200 rounded-lg bg-white"
              placeholder="時間（任意）"
            />
          </div>
          <input
            type="text"
            value={newMemo}
            onChange={e => setNewMemo(e.target.value)}
            className="text-sm py-1.5 px-2 border border-gray-200 rounded-lg bg-white w-full"
            placeholder="メモ（任意）"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="text-sm py-1.5 px-3 bg-primary-700 text-white rounded-lg">追加</button>
            <button onClick={resetAddForm} className="text-sm py-1.5 px-3 text-gray-600 rounded-lg">取消</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="text-xs text-primary-600 hover:text-primary-800 transition-colors"
        >
          + 締切を追加
        </button>
      )}
    </div>
  );
}
