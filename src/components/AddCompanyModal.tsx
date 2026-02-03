import { useState, useEffect, useCallback } from 'react';
import { Company, SelectionStatus, STATUS_LABELS, INDUSTRY_OPTIONS, createCompany, CompanySearchResult } from '@simplify/shared';
import { CompanyAutocomplete } from './CompanyAutocomplete';
import { normalizeWebsiteDomain } from '../utils/url';

interface AddCompanyDrawerProps {
  onSave: (company: Company) => void;
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

export default function AddCompanyDrawer({ onSave, onClose }: AddCompanyDrawerProps) {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [status, setStatus] = useState<SelectionStatus>('interested');
  const [memo, setMemo] = useState('');
  const [loginUrl, setLoginUrl] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [websiteDomain, setWebsiteDomain] = useState('');
  const [recruitUrl, setRecruitUrl] = useState('');
  const [visible, setVisible] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // 企業選択時のハンドラー
  const handleCompanySelect = useCallback((company: CompanySearchResult) => {
    setSelectedCompanyId(company.id);
    // 業種を自動入力（マスターにある場合）
    if (company.industry && (INDUSTRY_OPTIONS as readonly string[]).includes(company.industry)) {
      setIndustry(company.industry);
    }
    // websiteDomainを自動入力（ロゴ表示用）
    const normalizedDomain = normalizeWebsiteDomain(company.websiteDomain || company.websiteUrl);
    if (normalizedDomain) {
      setWebsiteDomain(normalizedDomain);
    }
    // 採用ページURLを自動入力
    if (company.recruitUrl) {
      setRecruitUrl(company.recruitUrl);
    }
    // マイページURLは自動入力しない（マスターデータが古い・間違っている可能性があるため）
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const updatedCompany: Company = {
      ...createCompany(name.trim()),
      industry: industry || undefined,
      status,
      memo: memo.trim() || undefined,
      loginUrl: loginUrl.trim() || undefined,
      loginPassword: loginPassword.trim() || undefined,
      websiteDomain: normalizeWebsiteDomain(websiteDomain),
      recruitUrl: recruitUrl.trim() || undefined,
    };

    onSave(updatedCompany);
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
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">企業を追加</h2>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          <div>
            <label className="input-label">
              企業名 <span className="text-error-500">*</span>
            </label>
            <CompanyAutocomplete
              value={name}
              onChange={setName}
              onSelect={handleCompanySelect}
              placeholder="企業名を入力（候補から選択可能）"
              autoFocus
              required
            />
            {selectedCompanyId && (
              <p className="mt-1 text-xs text-success-600">
                マスターデータから選択しました
              </p>
            )}
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
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
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
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-white">
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary"
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
}
