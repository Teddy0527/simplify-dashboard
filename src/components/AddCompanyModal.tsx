import { useState, useEffect } from 'react';
import { Company, SelectionStatus, STATUS_LABELS, createCompany } from '../shared/types';

interface AddCompanyModalProps {
  company?: Company | null;
  onSave: (company: Company) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const STATUS_ORDER: SelectionStatus[] = [
  'interested',
  'applied',
  'es_submitted',
  'webtest',
  'gd',
  'interview_1',
  'interview_2',
  'interview_3',
  'interview_final',
  'offer',
  'rejected',
  'declined',
];

export default function AddCompanyModal({ company, onSave, onDelete, onClose }: AddCompanyModalProps) {
  const [name, setName] = useState(company?.name || '');
  const [industry, setIndustry] = useState(company?.industry || '');
  const [status, setStatus] = useState<SelectionStatus>(company?.status || 'interested');
  const [deadline, setDeadline] = useState(company?.deadline || '');
  const [memo, setMemo] = useState(company?.memo || '');
  const [loginUrl, setLoginUrl] = useState(company?.loginUrl || '');

  const isEditing = !!company;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) return;

    const now = new Date().toISOString();
    const updatedCompany: Company = company
      ? {
          ...company,
          name: name.trim(),
          industry: industry.trim() || undefined,
          status,
          deadline: deadline || undefined,
          memo: memo.trim() || undefined,
          loginUrl: loginUrl.trim() || undefined,
          updatedAt: now,
        }
      : {
          ...createCompany(name.trim()),
          industry: industry.trim() || undefined,
          status,
          deadline: deadline || undefined,
          memo: memo.trim() || undefined,
          loginUrl: loginUrl.trim() || undefined,
        };

    onSave(updatedCompany);
  }

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-[var(--color-navy-800)] flex items-center justify-between bg-white">
          <h2
            className="text-lg font-semibold text-[var(--color-navy-900)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {isEditing ? '企業を編集' : '企業を追加'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-[var(--color-navy-50)] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-navy-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar bg-[var(--color-paper)]">
          <div>
            <label className="input-label">
              企業名 <span className="text-[var(--color-vermillion-500)]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="株式会社〇〇"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="input-label">業界</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="input-field"
              placeholder="IT・通信"
            />
          </div>

          <div>
            <label className="input-label">ステータス</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SelectionStatus)}
              className="select-field"
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">締切日</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">マイページURL</label>
            <input
              type="url"
              value={loginUrl}
              onChange={(e) => setLoginUrl(e.target.value)}
              className="input-field"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="input-label">メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              className="input-field resize-none"
              placeholder="選考に関するメモ..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--color-navy-100)] flex items-center justify-between gap-3 bg-white">
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={() => company && onDelete(company.id)}
              className="px-4 py-2 text-sm font-medium text-[var(--color-vermillion-500)] hover:text-[var(--color-vermillion-600)] hover:bg-[var(--color-vermillion-500)]/5 transition-colors"
            >
              削除
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              キャンセル
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="btn-primary"
            >
              <span>{isEditing ? '更新' : '追加'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
