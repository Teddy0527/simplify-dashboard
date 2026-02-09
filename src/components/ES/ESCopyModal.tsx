import { useState, useEffect, useMemo } from 'react';
import { EntrySheet } from '@jobsimplify/shared';
import { useCompanies } from '../../hooks/useCompanies';

interface ESCopyModalProps {
  sourceES: EntrySheet;
  requireCompany?: boolean;
  onConfirm: (newTitle: string, newCompanyId?: string, newCompanyName?: string) => void;
  onClose: () => void;
}

export default function ESCopyModal({ sourceES, requireCompany, onConfirm, onClose }: ESCopyModalProps) {
  const { companies } = useCompanies();

  const [title, setTitle] = useState(
    requireCompany ? sourceES.title : `${sourceES.title}（コピー）`
  );
  const [companyId, setCompanyId] = useState(sourceES.companyId ?? '');
  const [visible, setVisible] = useState(false);

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
    setTimeout(onClose, 200);
  }

  function handleConfirm() {
    if (!title.trim()) return;
    if (requireCompany && !companyId) return;

    const selectedCompany = companies.find(c => c.id === companyId);
    onConfirm(title.trim(), companyId || undefined, selectedCompany?.name);
  }

  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  }, [companies]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-200 ${visible ? 'opacity-30' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md bg-white rounded-xl shadow-xl transition-all duration-200 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${requireCompany ? 'bg-green-100' : 'bg-primary-100'} flex items-center justify-center`}>
              {requireCompany ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {requireCompany ? '企業ESとして使う' : 'ESをコピー'}
              </h2>
              <p className="text-sm text-gray-500">
                {requireCompany
                  ? `「${sourceES.title}」を企業ESとして作成します`
                  : `「${sourceES.title}」をコピーして新しいESを作成します`}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="input-label">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="新しいタイトル"
              autoFocus
            />
          </div>

          <div>
            <label className="input-label">
              企業{requireCompany ? '（必須）' : '（任意）'}
            </label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="select-field"
            >
              {requireCompany ? (
                <option value="">企業を選択してください</option>
              ) : (
                <option value="">テンプレート（企業を選択しない）</option>
              )}
              {sortedCompanies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
            {!requireCompany && (
              <p className="text-xs text-gray-400 mt-1">
                テンプレートをコピーして企業向けにカスタマイズできます
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={handleClose} className="btn-secondary">
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            disabled={!title.trim() || (requireCompany && !companyId)}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {requireCompany ? '作成' : 'コピーを作成'}
          </button>
        </div>
      </div>
    </div>
  );
}
