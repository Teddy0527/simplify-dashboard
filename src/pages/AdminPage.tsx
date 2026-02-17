import { useState, useEffect } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { useContributionReview } from '../hooks/useContributionReview';
import {
  DEADLINE_TYPE_LABELS,
  DeadlineType,
  searchDeadlinePresets,
  DeadlinePresetWithCompany,
  PendingContributionSummary,
  getSupabase,
} from '@jobsimplify/shared';
import { useAuth } from '../shared/hooks/useAuth';
import AnalyticsTab from '../components/admin/AnalyticsTab';

type Tab = 'review' | 'presets' | 'log' | 'analytics' | 'devtools';

const TABS: { key: Tab; label: string }[] = [
  { key: 'review', label: 'シグナルレビュー' },
  { key: 'presets', label: 'プリセット管理' },
  { key: 'log', label: '変更ログ' },
  { key: 'analytics', label: 'ユーザー分析' },
  { key: 'devtools', label: 'Dev Tools' },
];

export default function AdminPage() {
  const { loading: authLoading } = useAdminAuth();
  const [tab, setTab] = useState<Tab>('review');

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-6 bg-admin-bg min-h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">管理画面</h1>
        <p className="text-sm text-gray-500 mt-1">締切シグナルのレビュー・プリセット管理・ユーザー分析</p>
      </div>

      {/* Pill tab bar */}
      <div className="bg-gray-100 rounded-xl p-1 inline-flex gap-1 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? 'admin-pill-tab-active'
                : 'admin-pill-tab'
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'review' && <SignalReviewTab />}
      {tab === 'presets' && <PresetManagementTab />}
      {tab === 'log' && <ChangeLogTab />}
      {tab === 'analytics' && <AnalyticsTab />}
      {tab === 'devtools' && <DevToolsTab />}
    </div>
  );
}

// ────────────────────────────────────────────
// Tab 1: Signal Review
// ────────────────────────────────────────────

function SignalReviewTab() {
  const { summaries, loading, approve, reject } = useContributionReview();

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin mb-2" />
        <p className="text-sm">読み込み中...</p>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="mx-auto mb-3 w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm">レビュー待ちのシグナルはありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">{summaries.length}件のレビュー待ち</p>
      {summaries.map((s) => (
        <SignalCard key={`${s.companyMasterId}-${s.deadlineType}-${s.labelKey}`} summary={s} onApprove={approve} onReject={reject} />
      ))}
    </div>
  );
}

function SignalCard({
  summary,
  onApprove,
  onReject,
}: {
  summary: PendingContributionSummary;
  onApprove: (s: PendingContributionSummary, date?: string, time?: string, memo?: string) => Promise<void>;
  onReject: (s: PendingContributionSummary, reason?: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [date, setDate] = useState(summary.mostCommonDate);
  const [time, setTime] = useState('');
  const [memo, setMemo] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const logoUrl = summary.companyLogoUrl
    ? summary.companyLogoUrl
    : undefined;

  const typeLabel = DEADLINE_TYPE_LABELS[summary.deadlineType as DeadlineType] || summary.deadlineType;

  return (
    <div className={`card p-4 ${summary.isDivergent ? 'ring-2 ring-amber-300' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Company logo */}
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="w-8 h-8 rounded object-contain bg-white border border-gray-100 flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-medium flex-shrink-0">
            {summary.companyName.charAt(0)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{summary.companyName}</span>
            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
              {summary.contributorCount}人が報告
            </span>
            {summary.isDivergent && (
              <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                既存と異なる日付
              </span>
            )}
            {summary.uniqueDatesCount > 1 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                {summary.uniqueDatesCount}種類の日付
              </span>
            )}
          </div>

          {/* Deadline info */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">{typeLabel}</span>
            <span className="text-sm text-gray-700">{summary.label}</span>
            <span className="text-sm font-medium text-gray-900">{summary.mostCommonDate}</span>
          </div>

          {summary.existingPresetDate && (
            <p className="text-xs text-gray-500 mt-1">既存プリセット: {summary.existingPresetDate}</p>
          )}

          {/* Inline approve editor */}
          {editing && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="flex gap-2">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field text-sm" />
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input-field text-sm" placeholder="時間" />
              </div>
              <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} className="input-field text-sm" placeholder="メモ（任意）" />
              <div className="flex gap-2">
                <button
                  onClick={() => { onApprove(summary, date, time || undefined, memo || undefined); setEditing(false); }}
                  className="btn-primary text-sm px-3 py-1"
                >
                  承認
                </button>
                <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1">
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {/* Inline reject editor */}
          {rejecting && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
              <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="input-field text-sm" placeholder="却下理由（任意）" />
              <div className="flex gap-2">
                <button
                  onClick={() => { onReject(summary, rejectReason || undefined); setRejecting(false); }}
                  className="text-sm px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  却下
                </button>
                <button onClick={() => setRejecting(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1">
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!editing && !rejecting && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="btn-primary text-sm px-3 py-1.5"
            >
              承認
            </button>
            <button
              onClick={() => setRejecting(true)}
              className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              却下
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Tab 2: Preset Management
// ────────────────────────────────────────────

function PresetManagementTab() {
  const { recalculate } = useContributionReview();
  const [presets, setPresets] = useState<DeadlinePresetWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    searchDeadlinePresets('', 2027, 200, 0)
      .then(setPresets)
      .catch(() => setPresets([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await recalculate();
      const data = await searchDeadlinePresets('', 2027, 200, 0);
      setPresets(data);
    } finally {
      setRecalculating(false);
    }
  };

  const filtered = query
    ? presets.filter((p) => p.companyName.toLowerCase().includes(query.toLowerCase()) || p.label.toLowerCase().includes(query.toLowerCase()))
    : presets;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input-field flex-1"
          placeholder="プリセット検索..."
        />
        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="btn-primary text-sm px-4 py-2 whitespace-nowrap"
        >
          {recalculating ? 'カウント再計算中...' : 'カウント再計算'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin mb-2" />
          <p className="text-sm">読み込み中...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">プリセットが見つかりませんでした</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">{filtered.length}件のプリセット</p>
          {filtered.map((p) => (
            <div key={p.id} className="card px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{p.companyName}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                    {DEADLINE_TYPE_LABELS[p.deadlineType as DeadlineType] || p.deadlineType}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">{p.label}</p>
              </div>
              <span className="text-sm tabular-nums text-gray-700">{p.deadlineDate}</span>
              {p.contributorCount > 0 && (
                <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                  {p.contributorCount}人が報告
                </span>
              )}
              {p.verified && (
                <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">
                  検証済
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// Tab 3: Change Log (placeholder)
// ────────────────────────────────────────────

function ChangeLogTab() {
  return (
    <div className="text-center py-12 text-gray-500">
      <svg className="mx-auto mb-3 w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm">変更ログ機能は準備中です</p>
    </div>
  );
}

// ────────────────────────────────────────────
// Tab 5: Dev Tools
// ────────────────────────────────────────────

function DevToolsTab() {
  const { user } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleResetOnboarding() {
    if (!user) return;
    setResetting(true);
    setMessage(null);

    try {
      const supabase = getSupabase();
      // 1. Reset profile
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_status: 'pending',
          onboarding_variant: 'control',
          onboarding_skipped_at: null,
          onboarding_completed_at: null,
        })
        .eq('id', user.id);

      if (error) throw error;

      // 2. Delete onboarding-related events (checklist completion, started, etc.)
      await supabase
        .from('user_events')
        .delete()
        .eq('user_id', user.id)
        .like('event_type', 'onboarding.%');

      // 3. Clear localStorage flags
      localStorage.removeItem('welcome_shown');
      localStorage.removeItem('onboarding_checklist_v2');

      setMessage({ type: 'success', text: 'リセット完了。リロードします...' });
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'リセットに失敗しました' });
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">オンボーディングリセット</h3>
        <p className="text-xs text-gray-500 mb-4">
          自分のアカウントを初回ログイン状態に戻します。ウェルカムモーダル・チェックリストが再表示されます。
        </p>
        <button
          onClick={handleResetOnboarding}
          disabled={resetting}
          className="btn-primary text-sm px-4 py-2"
        >
          {resetting ? 'リセット中...' : 'オンボーディングをリセット'}
        </button>
        {message && (
          <p className={`text-xs mt-3 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
