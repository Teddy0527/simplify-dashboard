import { useState, useEffect } from 'react';
import { Company, SelectionStatus, SelectionStage, STATUS_LABELS, INDUSTRY_OPTIONS } from '@simplify/shared';
import StageTimeline from './StageTimeline';
import ConfirmDialog from './Common/ConfirmDialog';

interface CompanyDrawerProps {
  company: Company;
  onSave: (company: Company) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const ALL_STATUSES: SelectionStatus[] = [
  'interested', 'applied', 'es_submitted', 'webtest', 'gd',
  'interview_1', 'interview_2', 'interview_3', 'interview_final',
  'offer', 'rejected', 'declined',
];

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

export default function CompanyDrawer({ company, onSave, onDelete, onClose }: CompanyDrawerProps) {
  const [name, setName] = useState(company.name);
  const [industry, setIndustry] = useState(company.industry || '');
  const [status, setStatus] = useState<SelectionStatus>(company.status);
  const [memo, setMemo] = useState(company.memo || '');
  const [loginUrl, setLoginUrl] = useState(company.loginUrl || '');
  const [loginPassword, setLoginPassword] = useState(company.loginPassword || '');
  const [stages, setStages] = useState<SelectionStage[]>(company.stages ?? []);
  const [visible, setVisible] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 250);
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      ...company,
      name: name.trim(),
      industry: industry || undefined,
      status,
      memo: memo.trim() || undefined,
      loginUrl: loginUrl.trim() || undefined,
      loginPassword: loginPassword.trim() || undefined,
      stages,
      updatedAt: new Date().toISOString(),
    });
    handleClose();
  }

  function handleDelete() {
    setShowConfirm(true);
  }

  function confirmDelete() {
    setShowConfirm(false);
    onDelete(company.id);
    handleClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-250 ${visible ? 'opacity-30' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Drawer panel */}
      <div
        className={`relative w-full max-w-2xl bg-white shadow-xl flex flex-col transition-transform duration-250 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg ${getInitialColor(company.name)} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white text-base font-semibold">{company.name[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {company.name}
            </h2>
            {company.industry && (
              <p className="text-xs text-gray-500">{company.industry}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-lg transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          <div>
            <label className="input-label">企業名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">業界</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="select-field"
            >
              <option value="">選択してください</option>
              {INDUSTRY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">ステータス</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SelectionStatus)}
              className="select-field"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
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
            <label className="input-label">マイページパスワード</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="input-field"
              placeholder="パスワード"
            />
          </div>

          {/* Stage Timeline */}
          <div className="border-t border-gray-200 pt-4">
            <StageTimeline
              stages={stages}
              currentStatus={status}
              onStagesChange={setStages}
            />
          </div>

          <div>
            <label className="input-label">メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={4}
              className="input-field resize-none"
              placeholder="選考に関するメモ..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between">
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-error-600 hover:text-error-700 hover:bg-error-50 rounded-lg transition-colors"
          >
            削除
          </button>
          <div className="flex gap-2">
            <button onClick={handleClose} className="btn-secondary">キャンセル</button>
            <button onClick={handleSave} className="btn-primary">保存</button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="企業を削除"
        message={`「${company.name}」を削除しますか？この操作は取り消せません。`}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
