import { useState } from 'react';
import {
  JobSite,
  JOB_SITE_CATEGORY_LABELS,
  JOB_SITE_PRIORITY_LABELS,
  JobSitePriority,
  getGmailSearchUrl,
  getMailSearchQuery,
  trackEventAsync,
} from '@jobsimplify/shared';

function formatRelativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今日確認済み';
  if (diffDays === 1) return '昨日確認';
  if (diffDays < 7) return `${diffDays}日前に確認`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前に確認`;
  return `${Math.floor(diffDays / 30)}ヶ月前に確認`;
}

const PRIORITY_COLORS: Record<JobSitePriority, string> = {
  high: 'bg-error-50 text-error-700',
  medium: 'bg-warning-50 text-warning-700',
  low: 'bg-gray-100 text-gray-600',
};

interface JobSiteCardProps {
  site: JobSite;
  onEdit: (site: JobSite) => void;
  onDelete: (site: JobSite) => void;
  onMarkChecked: (site: JobSite) => void;
}

export default function JobSiteCard({ site, onEdit, onDelete, onMarkChecked }: JobSiteCardProps) {
  const [showMailMenu, setShowMailMenu] = useState(false);
  const gmailUrl = getGmailSearchUrl(site);
  const hasEmailDomains = site.emailDomains.length > 0;

  function handleSiteLinkClick() {
    trackEventAsync('job_site.site_link_click', { siteId: site.id });
  }

  function handleGmailSearchClick() {
    trackEventAsync('job_site.gmail_search_click', { siteId: site.id });
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    setShowMailMenu(false);
  }

  async function handleCopyQuery() {
    const query = getMailSearchQuery(site);
    if (query) {
      await navigator.clipboard.writeText(query);
      trackEventAsync('job_site.query_copy', { siteId: site.id });
    }
    setShowMailMenu(false);
  }

  function handleMarkChecked() {
    trackEventAsync('job_site.check_mark', { siteId: site.id });
    onMarkChecked(site);
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{site.name}</h3>
          {site.url && (
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleSiteLinkClick}
              className="text-xs text-primary-600 hover:text-primary-800 truncate block mt-0.5"
            >
              {site.url}
            </a>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(site)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="編集"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(site)}
            className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
            title="削除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
          {JOB_SITE_CATEGORY_LABELS[site.category]}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[site.priority]}`}>
          優先度: {JOB_SITE_PRIORITY_LABELS[site.priority]}
        </span>
      </div>

      {site.loginId && (
        <p className="text-xs text-gray-500">
          <span className="font-medium text-gray-600">ID:</span> {site.loginId}
        </p>
      )}

      {site.memo && (
        <p className="text-xs text-gray-500 line-clamp-2">{site.memo}</p>
      )}

      {hasEmailDomains && (
        <div className="relative">
          <button
            onClick={() => setShowMailMenu((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            メールを見る
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showMailMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMailMenu(false)} />
              <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]">
                <button
                  onClick={handleGmailSearchClick}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Gmailで検索
                </button>
                <button
                  onClick={handleCopyQuery}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  検索クエリをコピー
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <span className={`text-xs ${site.lastCheckedAt ? 'text-gray-500' : 'text-gray-400'}`}>
          {site.lastCheckedAt ? formatRelativeDate(site.lastCheckedAt) : '未確認'}
        </span>
        <button
          onClick={handleMarkChecked}
          className="text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors"
        >
          確認済みにする
        </button>
      </div>
    </div>
  );
}
