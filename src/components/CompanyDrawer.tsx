import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Company, SelectionStatus, SelectionStage, STATUS_LABELS, INDUSTRY_OPTIONS } from '@simplify/shared';
import StageTimeline from './StageTimeline';
import ConfirmDialog from './Common/ConfirmDialog';
import { CompanyLogo } from './ui/CompanyLogo';
import { useEntrySheetContext } from '../contexts/EntrySheetContext';

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

export default function CompanyDrawer({ company, onSave, onDelete, onClose }: CompanyDrawerProps) {
  const navigate = useNavigate();
  const { entrySheets } = useEntrySheetContext();
  const [name, setName] = useState(company.name);
  const [status, setStatus] = useState<SelectionStatus>(company.status);
  const [memo, setMemo] = useState(company.memo || '');
  const [loginUrl, setLoginUrl] = useState(company.loginUrl || '');
  const [loginPassword, setLoginPassword] = useState(company.loginPassword || '');
  const [industry, setIndustry] = useState(company.industry || '');
  const [stages, setStages] = useState<SelectionStage[]>(company.stages ?? []);
  const [visible, setVisible] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const companyES = useMemo(
    () => entrySheets.filter(es => es.companyId === company.id).slice(0, 3),
    [entrySheets, company.id],
  );
  const totalESCount = useMemo(
    () => entrySheets.filter(es => es.companyId === company.id).length,
    [entrySheets, company.id],
  );

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
      status,
      memo: memo.trim() || undefined,
      loginUrl: loginUrl.trim() || undefined,
      loginPassword: loginPassword.trim() || undefined,
      websiteDomain: company.websiteDomain,
      industry: industry || undefined,
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
          <CompanyLogo
            name={company.name}
            logoUrl={company.logoUrl}
            websiteDomain={company.websiteDomain}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {company.name}
            </h2>
            {company.recruitUrl && (
              <a
                href={company.recruitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
              >
                採用ページ →
              </a>
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

          {/* ES Section */}
          <div className="border-t border-gray-200 pt-4">
            <label className="input-label flex items-center justify-between">
              <span>エントリーシート</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/es?company=${company.id}&action=create`)}
                  className="text-xs text-primary-600 hover:text-primary-700 font-normal flex items-center gap-0.5"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  ES作成
                </button>
                {totalESCount > 0 && (
                  <button
                    onClick={() => navigate(`/es?company=${company.id}`)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-normal"
                  >
                    すべて表示 ({totalESCount})
                  </button>
                )}
              </div>
            </label>
            {companyES.length === 0 ? (
              <p className="text-xs text-gray-400 mt-1">ESはまだありません</p>
            ) : (
              <div className="space-y-2 mt-2">
                {companyES.map(es => {
                  const answered = es.questions.filter(q => q.answer?.trim()).length;
                  const total = es.questions.length;
                  const hasFreeform = !!es.freeformContent && es.freeformContent.replace(/<[^>]*>/g, '').trim().length > 0;
                  const hasLinks = !!es.externalLinks && es.externalLinks.length > 0;
                  return (
                    <div
                      key={es.id}
                      onClick={() => navigate(`/es?company=${company.id}`)}
                      className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">{es.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {total > 0 && (
                          <span className="text-xs text-gray-500">{answered}/{total}設問</span>
                        )}
                        {hasFreeform && (
                          <span className="text-xs text-gray-400">
                            <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </span>
                        )}
                        {hasLinks && (
                          <span className="text-xs text-gray-400">
                            <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
