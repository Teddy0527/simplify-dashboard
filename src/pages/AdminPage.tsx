import { useState, useEffect } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';
import {
  getSupabase,
  getAllFeedback,
  FeedbackRow,
} from '@jobsimplify/shared';
import { useAuth } from '../shared/hooks/useAuth';
import AnalyticsTab from '../components/admin/AnalyticsTab';
import PopularCompaniesSection from '../components/admin/analytics/PopularCompaniesSection';

type Tab = 'companies' | 'analytics' | 'test-users' | 'devtools';

const TABS: { key: Tab; label: string }[] = [
  { key: 'companies', label: '企業一覧' },
  { key: 'analytics', label: 'ユーザー分析' },
  { key: 'test-users', label: 'テストユーザー' },
  { key: 'devtools', label: 'Dev Tools' },
];

export default function AdminPage() {
  const { loading: authLoading } = useAdminAuth();
  const [tab, setTab] = useState<Tab>('companies');

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
        <p className="text-sm text-gray-500 mt-1">企業一覧・ユーザー分析</p>
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

      {tab === 'companies' && <PopularCompaniesSection />}
      {tab === 'analytics' && <AnalyticsTab />}
      {tab === 'test-users' && <TestUserRequestsTab />}
      {tab === 'devtools' && <DevToolsTab />}
    </div>
  );
}

// ────────────────────────────────────────────
// Tab: Test User Requests
// ────────────────────────────────────────────

interface TestUserRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at: string | null;
}

function TestUserRequestsTab() {
  const [requests, setRequests] = useState<TestUserRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    const { data } = await getSupabase()
      .from('calendar_test_user_requests')
      .select('*')
      .order('requested_at', { ascending: false });
    setRequests((data as TestUserRequest[]) ?? []);
    setLoading(false);
  }

  async function handleAction(request: TestUserRequest, action: 'approved' | 'rejected') {
    setActionLoading(request.id);
    const supabase = getSupabase();

    // Update request status
    const { error: statusError } = await supabase
      .from('calendar_test_user_requests')
      .update({ status: action, reviewed_at: new Date().toISOString() })
      .eq('id', request.id);

    if (statusError) {
      alert(`ステータス更新に失敗しました: ${statusError.message}`);
      setActionLoading(null);
      return;
    }

    // If approved, set is_test_user_approved on user_calendar_settings
    if (action === 'approved') {
      const { error: settingsError } = await supabase
        .from('user_calendar_settings')
        .upsert(
          { user_id: request.user_id, is_test_user_approved: true },
          { onConflict: 'user_id' },
        );

      if (settingsError) {
        alert(`カレンダー設定の更新に失敗しました: ${settingsError.message}`);
      }
    }

    await loadRequests();
    setActionLoading(null);
  }

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin mb-2" />
        <p className="text-xs">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500">
            {requests.length}件の申請 ・ {pendingCount}件が承認待ち
          </p>
        </div>
        <button
          onClick={loadRequests}
          className="text-xs text-primary-600 hover:text-primary-800 transition-colors"
        >
          更新
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">
          <p className="text-sm">テストユーザー申請はまだありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {req.user_name ?? '名前なし'}
                    </p>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{req.user_email}</p>
                  <p className="text-[10px] text-gray-300 mt-1">
                    申請日: {new Date(req.requested_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {req.reviewed_at && (
                      <> ・ 対応日: {new Date(req.reviewed_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</>
                    )}
                  </p>
                </div>

                {req.status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleAction(req, 'approved')}
                      disabled={actionLoading === req.id}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      {actionLoading === req.id ? '...' : '承認'}
                    </button>
                    <button
                      onClick={() => handleAction(req, 'rejected')}
                      disabled={actionLoading === req.id}
                      className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      拒否
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const styles = {
    pending: 'bg-amber-50 text-amber-600',
    approved: 'bg-green-50 text-green-600',
    rejected: 'bg-gray-100 text-gray-400',
  };
  const labels = {
    pending: '承認待ち',
    approved: '承認済み',
    rejected: '拒否',
  };
  return (
    <span className={`text-[10px] rounded-full px-2 py-0.5 ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ────────────────────────────────────────────
// Tab: Dev Tools
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

  function handleForceFeedback() {
    localStorage.setItem('feedback_session_count', '5');
    localStorage.setItem('welcome_shown_v2', '1');
    localStorage.removeItem('feedback_last_interaction_ts');
    localStorage.removeItem('feedback_opted_out');
    localStorage.removeItem('feedback_last_session_id');
    localStorage.setItem('onboarding_checklist_v3', JSON.stringify({ dismissed: true }));
    setMessage({ type: 'success', text: 'フィードバックモーダルを有効化しました。リロードします...' });
    setTimeout(() => window.location.reload(), 800);
  }

  function handleResetFeedback() {
    localStorage.removeItem('feedback_session_count');
    localStorage.removeItem('feedback_last_interaction_ts');
    localStorage.removeItem('feedback_opted_out');
    localStorage.removeItem('feedback_last_session_id');
    setMessage({ type: 'success', text: 'フィードバック状態をリセットしました。' });
  }

  return (
    <div className="max-w-2xl space-y-4">
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

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">フィードバックモーダル</h3>
        <p className="text-xs text-gray-500 mb-4">
          フィードバックモーダルの表示条件を操作します。
        </p>
        <div className="flex gap-2">
          <button onClick={handleForceFeedback} className="btn-primary text-sm px-4 py-2">
            強制表示（リロード）
          </button>
          <button onClick={handleResetFeedback} className="text-sm px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            状態リセット
          </button>
        </div>
        <div className="mt-3 text-xs text-gray-400 space-y-0.5">
          <p>セッション数: {localStorage.getItem('feedback_session_count') ?? '0'}</p>
          <p>オプトアウト: {localStorage.getItem('feedback_opted_out') === '1' ? 'はい' : 'いいえ'}</p>
          <p>最終操作: {localStorage.getItem('feedback_last_interaction_ts') ? new Date(Number(localStorage.getItem('feedback_last_interaction_ts'))).toLocaleString('ja-JP') : 'なし'}</p>
        </div>
      </div>

      <FeedbackListCard />
    </div>
  );
}

// ────────────────────────────────────────────
// Feedback List (Admin)
// ────────────────────────────────────────────

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating}点`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="14" height="14" viewBox="0 0 24 24"
          fill={s <= rating ? '#f59e0b' : 'none'}
          stroke={s <= rating ? '#f59e0b' : '#d1d5db'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

function FeedbackListCard() {
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllFeedback(100)
      .then(setFeedbacks)
      .finally(() => setLoading(false));
  }, []);

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : '-';

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">フィードバック一覧</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {feedbacks.length}件 ・ 平均評価 {avgRating}
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); getAllFeedback(100).then(setFeedbacks).finally(() => setLoading(false)); }}
          className="text-xs text-primary-600 hover:text-primary-800 transition-colors"
        >
          更新
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin mb-2" />
          <p className="text-xs">読み込み中...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">フィードバックはまだありません</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <StarDisplay rating={fb.rating} />
                <span className="text-xs text-gray-400">
                  {new Date(fb.created_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {(fb.satisfaction || fb.complaints || fb.feature_requests) ? (
                <div className="space-y-1.5 text-xs">
                  {fb.satisfaction && (
                    <div>
                      <span className="font-medium text-gray-600">満足度: </span>
                      <span className="text-gray-800">{fb.satisfaction}</span>
                    </div>
                  )}
                  {fb.complaints && (
                    <div>
                      <span className="font-medium text-gray-600">不便な点: </span>
                      <span className="text-gray-800">{fb.complaints}</span>
                    </div>
                  )}
                  {fb.feature_requests && (
                    <div>
                      <span className="font-medium text-gray-600">要望: </span>
                      <span className="text-gray-800">{fb.feature_requests}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">テキストフィードバックなし（星のみ）</p>
              )}
              <p className="text-[10px] text-gray-300 mt-2 font-mono">{fb.user_id.slice(0, 8)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
