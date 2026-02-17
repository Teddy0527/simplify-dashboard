import { useState, useEffect } from 'react';
import {
  JobSite,
  JobSiteCategory,
  JobSitePriority,
  JOB_SITE_CATEGORY_LABELS,
  JOB_SITE_PRIORITY_LABELS,
  JOB_SITE_PRESETS,
  createJobSite,
} from '@jobsimplify/shared';

interface JobSiteFormDrawerProps {
  site?: JobSite | null;
  onSave: (site: JobSite) => void;
  onClose: () => void;
}

function isValidUrl(url: string): boolean {
  if (!url) return true;
  return /^https?:\/\//.test(url);
}

export default function JobSiteFormDrawer({ site, onSave, onClose }: JobSiteFormDrawerProps) {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState(site?.name ?? '');
  const [url, setUrl] = useState(site?.url ?? '');
  const [emailDomainsStr, setEmailDomainsStr] = useState(site?.emailDomains.join(', ') ?? '');
  const [category, setCategory] = useState<JobSiteCategory>(site?.category ?? 'other');
  const [priority, setPriority] = useState<JobSitePriority>(site?.priority ?? 'medium');
  const [loginId, setLoginId] = useState(site?.loginId ?? '');
  const [memo, setMemo] = useState(site?.memo ?? '');
  const [urlError, setUrlError] = useState('');

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

  function applyPreset(preset: (typeof JOB_SITE_PRESETS)[number]) {
    setName(preset.name);
    setUrl(preset.url);
    setEmailDomainsStr(preset.emailDomains.join(', '));
    setCategory(preset.category);
  }

  function parseEmailDomains(str: string): string[] {
    return str
      .split(/[,、\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const trimmedUrl = url.trim();
    if (trimmedUrl && !isValidUrl(trimmedUrl)) {
      setUrlError('URLはhttp://またはhttps://で始めてください');
      return;
    }
    setUrlError('');

    const emailDomains = parseEmailDomains(emailDomainsStr);
    const now = new Date().toISOString();

    if (site) {
      onSave({
        ...site,
        name: name.trim(),
        url: trimmedUrl || undefined,
        emailDomains,
        category,
        priority,
        loginId: loginId.trim() || undefined,
        memo: memo.trim() || undefined,
        updatedAt: now,
      });
    } else {
      onSave(
        createJobSite({
          name: name.trim(),
          url: trimmedUrl || undefined,
          emailDomains,
          category,
          priority,
          loginId: loginId.trim() || undefined,
          memo: memo.trim() || undefined,
        }),
      );
    }
    handleClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-250 ${visible ? 'opacity-40' : 'opacity-0'}`}
        onClick={handleClose}
      />
      <div
        className={`ml-auto relative w-full max-w-md bg-white shadow-xl flex flex-col transition-transform duration-250 ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            {site ? 'サイトを編集' : 'サイトを追加'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {!site && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プリセットから選択
              </label>
              <div className="flex flex-wrap gap-2">
                {JOB_SITE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 text-gray-700 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              サイト名 <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="例: マイナビ"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError('');
              }}
              className={`input-field ${urlError ? 'border-error-500 focus:ring-error-500' : ''}`}
              placeholder="https://..."
            />
            {urlError && <p className="mt-1 text-xs text-error-600">{urlError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールドメイン
            </label>
            <input
              type="text"
              value={emailDomainsStr}
              onChange={(e) => setEmailDomainsStr(e.target.value)}
              className="input-field"
              placeholder="例: @mynavi.jp, @snar.jp"
            />
            <p className="mt-1 text-xs text-gray-400">
              カンマ区切りで複数入力可。Gmailフィルタ・メール検索に使用します。
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as JobSiteCategory)}
              className="select-field"
            >
              {(Object.entries(JOB_SITE_CATEGORY_LABELS) as [JobSiteCategory, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">優先度</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as JobSitePriority)}
              className="select-field"
            >
              {(Object.entries(JOB_SITE_PRIORITY_LABELS) as [JobSitePriority, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ログインID</label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="input-field"
              placeholder="例: user@example.com"
            />
            <p className="mt-1 text-xs text-gray-400">
              ログインIDはお使いの端末/アカウントに保存されます。
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="input-field resize-none"
              rows={3}
              placeholder="自由にメモを残せます"
            />
          </div>

          <div className="pt-2">
            <button type="submit" className="btn-primary w-full text-sm py-2.5">
              {site ? '保存' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
