import { useState } from 'react';
import type { ESExternalLink } from '@simplify/shared';

interface ESExternalLinksEditorProps {
  links: ESExternalLink[];
  onChange: (links: ESExternalLink[]) => void;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function getFaviconUrl(url: string): string {
  const domain = getDomain(url);
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
}

export default function ESExternalLinksEditor({ links, onChange }: ESExternalLinksEditorProps) {
  const [showForm, setShowForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [urlError, setUrlError] = useState('');

  function handleAdd() {
    const trimmedUrl = newUrl.trim();
    if (!trimmedUrl) return;

    try {
      new URL(trimmedUrl);
    } catch {
      setUrlError('有効なURLを入力してください');
      return;
    }

    const label = newLabel.trim() || getDomain(trimmedUrl) || trimmedUrl;

    const newLink: ESExternalLink = {
      id: crypto.randomUUID(),
      url: trimmedUrl,
      label,
      addedAt: new Date().toISOString(),
    };

    onChange([...links, newLink]);
    setNewUrl('');
    setNewLabel('');
    setUrlError('');
    setShowForm(false);
  }

  function handleRemove(id: string) {
    onChange(links.filter(l => l.id !== id));
  }

  function handleOpenLink(e: React.MouseEvent, url: string) {
    e.preventDefault();
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="space-y-3">
      {links.map(link => (
        <div
          key={link.id}
          className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg group"
        >
          <img
            src={getFaviconUrl(link.url)}
            alt=""
            className="w-5 h-5 flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{link.label}</p>
            <p className="text-xs text-gray-400 truncate">{link.url}</p>
          </div>
          <button
            type="button"
            onClick={(e) => handleOpenLink(e, link.url)}
            className="p-1.5 text-gray-400 hover:text-primary-600 rounded transition-colors"
            title="開く"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => handleRemove(link.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors opacity-0 group-hover:opacity-100"
            title="削除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ))}

      {showForm ? (
        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
          <div>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => { setNewUrl(e.target.value); setUrlError(''); }}
              className="input-field text-sm"
              placeholder="https://docs.google.com/..."
              autoFocus
            />
            {urlError && <p className="text-xs text-red-500 mt-1">{urlError}</p>}
          </div>
          <div>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="input-field text-sm"
              placeholder="ラベル（空欄でドメイン名を使用）"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowForm(false); setNewUrl(''); setNewLabel(''); setUrlError(''); }}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="btn-primary text-xs py-1.5 px-3"
            >
              追加
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          リンクを追加
        </button>
      )}
    </div>
  );
}
