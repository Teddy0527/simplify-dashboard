import { useState, useEffect, useCallback } from 'react';
import { useGmail } from '../hooks/useGmail';
import { useAllEmails } from '../hooks/useAllEmails';
import { useCompanies } from '../hooks/useCompanies';
import type { CachedEmail, EmailTier } from '@jobsimplify/shared';
import { SUB_TYPE_LABELS } from '@jobsimplify/shared';
import type { SyncResult } from '../hooks/useGmail';
import { getGmailUrl } from '../services/gmailSyncService';

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  if (isYesterday) return '昨日';
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

const TIER_COLORS: Record<EmailTier, { bg: string; text: string; dot: string }> = {
  tier1: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  tier2: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  tier3: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  tier4: { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' },
};

const TIER_ICONS: Record<EmailTier, string> = {
  tier1: '🔴',
  tier2: '🟡',
  tier3: '🟠',
  tier4: '⚪',
};

function SubTypeBadge({ subType }: { subType?: string }) {
  if (!subType) return null;
  const label = SUB_TYPE_LABELS[subType as keyof typeof SUB_TYPE_LABELS];
  if (!label) return null;
  return (
    <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary-50 text-primary-700">
      {label}
    </span>
  );
}

function EmailDetail({
  email,
  onClose,
}: {
  email: CachedEmail;
  onClose: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <button
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          戻る
        </button>
      </div>
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{email.subject}</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="font-medium text-gray-700">{email.senderName ?? email.senderEmail}</span>
          <span>&lt;{email.senderEmail}&gt;</span>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {new Date(email.receivedAt).toLocaleString('ja-JP')}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <p className="text-gray-600 text-sm leading-relaxed">{email.snippet}</p>
        <div className="mt-6">
          <a
            href={getGmailUrl(email.gmailMessageId)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Gmailで全文を読む
          </a>
        </div>
      </div>
    </div>
  );
}

function EmailRow({
  email,
  onClick,
  isSelected,
  showSubType,
}: {
  email: CachedEmail;
  onClick: () => void;
  isSelected: boolean;
  showSubType?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-primary-50 border-l-2 border-l-primary-600' : ''
      } ${!email.isRead ? 'bg-blue-50/30' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {!email.isRead && (
              <div className="w-2 h-2 rounded-full bg-primary-600 flex-shrink-0" />
            )}
            <span className={`text-sm truncate ${!email.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
              {email.senderName ?? email.senderEmail}
            </span>
            {showSubType && <SubTypeBadge subType={email.classificationSubType} />}
          </div>
          <p className={`text-sm truncate mt-0.5 ${!email.isRead ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
            {email.subject}
          </p>
          <p className="text-xs text-gray-400 truncate mt-0.5">{email.snippet}</p>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
          {formatDate(email.receivedAt)}
        </span>
      </div>
    </button>
  );
}

function ConnectPrompt({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Gmailを連携しましょう</h2>
        <p className="text-sm text-gray-500 mb-6">
          Gmailを連携すると、登録企業からのメールを自動で取得・整理できます。
        </p>
        <button onClick={onConnect} className="btn-primary text-sm">
          Gmailを連携する
        </button>
      </div>
    </div>
  );
}

function EmptyState({
  syncError,
  lastSyncResult,
  onRetry,
}: {
  syncError: string | null;
  lastSyncResult: SyncResult | null;
  onRetry: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={syncError ? 'text-red-400' : 'text-gray-400'}>
            <path d="M22 17H2a3 3 0 003 3h14a3 3 0 003-3z" />
            <path d="M2 17V7a3 3 0 013-3h14a3 3 0 013 3v10" />
          </svg>
        </div>
        {syncError ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">同期エラー</h2>
            <p className="text-sm text-red-600 mb-4">{syncError}</p>
            <button onClick={onRetry} className="btn-primary text-sm">
              再試行
            </button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">受信メールが見つかりません</h2>
            <p className="text-sm text-gray-500">
              過去30日間の受信メールが見つかりませんでした。上部の「同期」ボタンで再取得できます。
            </p>
          </>
        )}
        {lastSyncResult && (
          <div className="mt-4 text-left bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-600 mb-1">診断情報</p>
            {lastSyncResult.connectedEmail && (
              <p>接続アカウント: {lastSyncResult.connectedEmail}</p>
            )}
            {lastSyncResult.diagnostics && (
              <>
                <p>検索クエリ: {lastSyncResult.diagnostics.query}</p>
                <p>Gmail検索結果: {lastSyncResult.diagnostics.totalMessageIds}件</p>
                {lastSyncResult.diagnostics.metadataFailed > 0 && (
                  <p className="text-amber-600">メタデータ取得失敗: {lastSyncResult.diagnostics.metadataFailed}件</p>
                )}
              </>
            )}
            {lastSyncResult.diagnostics?.totalMessageIds === 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200 text-gray-400">
                <p className="font-medium text-gray-500 mb-1">考えられる原因:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>受信トレイにメールがない</li>
                  <li>過去30日以内のメールが対象です</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type ViewMode = 'tier' | 'company';

export default function EmailsPage() {
  const { companies } = useCompanies();
  const gmail = useGmail();
  const { emailsByCompany, emailsByTier, unmatchedEmails, isLoading: isLoadingEmails, refresh } = useAllEmails(companies);
  const [selectedEmail, setSelectedEmail] = useState<CachedEmail | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('tier');
  const [collapsedTiers, setCollapsedTiers] = useState<Set<string>>(new Set(['tier4']));

  const handleSync = useCallback(() => {
    gmail.sync(companies).then((result) => {
      setLastSyncResult(result);
      if (!result.success) {
        setSyncError(result.error ?? '同期に失敗しました');
      } else {
        setSyncError(null);
      }
    }).finally(() => refresh());
  }, [gmail, companies, refresh]);

  // Auto-sync on mount if connected
  useEffect(() => {
    if (gmail.isConnected && !gmail.isSyncing) {
      handleSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gmail.isConnected, companies.length]);

  const handleEmailClick = useCallback((email: CachedEmail) => {
    setSelectedEmail(email);
  }, []);

  if (gmail.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!gmail.isConnected) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">メール</h1>
        </div>
        <ConnectPrompt onConnect={gmail.connect} />
      </div>
    );
  }

  if (selectedEmail) {
    return (
      <div className="h-full flex flex-col">
        <EmailDetail
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
        />
      </div>
    );
  }

  const hasEmails = emailsByCompany.length > 0 || unmatchedEmails.length > 0;

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">メール</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            受信メールを一覧表示
            {lastSyncResult?.connectedEmail && (
              <span className="ml-2 text-xs text-gray-400">({lastSyncResult.connectedEmail})</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('tier')}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'tier' ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              分類別
            </button>
            <button
              onClick={() => setViewMode('company')}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'company' ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              企業別
            </button>
          </div>
          <span className="text-xs text-gray-400">
            {gmail.isSyncing && gmail.syncProgress
              ? `同期中... ${gmail.syncProgress.fetched}/${gmail.syncProgress.total}`
              : gmail.settings?.lastSyncAt
                ? `最終同期: ${formatRelativeTime(gmail.settings.lastSyncAt)}`
                : '未同期'}
          </span>
          <button
            onClick={handleSync}
            disabled={gmail.isSyncing}
            className="btn-ghost text-sm flex items-center gap-1.5"
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={gmail.isSyncing ? 'animate-spin' : ''}
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            同期
          </button>
        </div>
      </div>

      {isLoadingEmails || gmail.isSyncing ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
            {gmail.syncProgress && (
              <p className="text-sm text-gray-500">
                メールを取得中... {gmail.syncProgress.fetched}/{gmail.syncProgress.total}
              </p>
            )}
          </div>
        </div>
      ) : !hasEmails ? (
        <EmptyState syncError={syncError} lastSyncResult={lastSyncResult} onRetry={handleSync} />
      ) : (
        <div className="flex-1 overflow-y-auto">
          {viewMode === 'tier' ? (
            <>
              {emailsByTier.map((group) => {
                const colors = TIER_COLORS[group.tier];
                const isCollapsed = collapsedTiers.has(group.tier);
                return (
                  <div key={group.tier}>
                    <button
                      onClick={() => {
                        setCollapsedTiers((prev) => {
                          const next = new Set(prev);
                          if (next.has(group.tier)) next.delete(group.tier);
                          else next.add(group.tier);
                          return next;
                        });
                      }}
                      className={`w-full flex items-center gap-3 px-6 py-3 ${colors.bg} hover:brightness-95 transition-colors sticky top-0 z-10 border-b border-gray-200`}
                    >
                      <span className="text-sm">{TIER_ICONS[group.tier]}</span>
                      <span className={`text-sm font-semibold ${colors.text} flex-1 text-left`}>
                        {group.label}
                      </span>
                      <span className={`text-xs ${colors.text} bg-white/60 rounded-full px-2 py-0.5`}>
                        {group.emails.length}
                      </span>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        className={`text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                    {!isCollapsed &&
                      group.emails.map((email) => (
                        <EmailRow
                          key={email.id}
                          email={email}
                          onClick={() => handleEmailClick(email)}
                          isSelected={false}
                          showSubType={group.tier === 'tier1'}
                        />
                      ))}
                  </div>
                );
              })}
            </>
          ) : (
            <>
              {emailsByCompany.map((group) => (
                <div key={group.companyId}>
                  <button
                    onClick={() => setSelectedCompanyId(
                      selectedCompanyId === group.companyId ? null : group.companyId,
                    )}
                    className="w-full flex items-center gap-3 px-6 py-3 bg-gray-50 hover:bg-gray-100 transition-colors sticky top-0 z-10 border-b border-gray-200"
                  >
                    {group.logoUrl ? (
                      <img src={group.logoUrl} alt="" className="w-6 h-6 rounded" />
                    ) : (
                      <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
                        {group.companyName.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-gray-800 flex-1 text-left">
                      {group.companyName}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-200 rounded-full px-2 py-0.5">
                      {group.totalCount}
                    </span>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={`text-gray-400 transition-transform ${selectedCompanyId === group.companyId ? 'rotate-180' : ''}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {(selectedCompanyId === group.companyId || selectedCompanyId === null) &&
                    group.emails.map((email) => (
                      <EmailRow
                        key={email.id}
                        email={email}
                        onClick={() => handleEmailClick(email)}
                        isSelected={false}
                      />
                    ))}
                </div>
              ))}
              {unmatchedEmails.length > 0 && (
                <div>
                  <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                    <span className="text-sm font-semibold text-gray-500">未分類</span>
                    <span className="text-xs text-gray-400 ml-2">({unmatchedEmails.length})</span>
                  </div>
                  {unmatchedEmails.map((email) => (
                    <EmailRow
                      key={email.id}
                      email={email}
                      onClick={() => handleEmailClick(email)}
                      isSelected={false}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
