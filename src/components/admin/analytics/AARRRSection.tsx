import { useState } from 'react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { AARRRData, GA4MetricsResponse } from '@jobsimplify/shared';
import { CHART_TOOLTIP_STYLE } from './shared';
import { AARRR_GOALS } from './constants';

// ── GoalProgressBar ─────────────────────────────────────────────────────

function GoalProgressBar({ current, goal, label, format = 'number' }: {
  current: number;
  goal: number;
  label: string;
  format?: 'number' | 'percent';
}) {
  const ratio = goal === 0 ? 0 : current / goal;
  const pct = Math.min(ratio * 100, 100);
  const achieved = ratio >= 1;
  const color = achieved ? 'bg-gradient-to-r from-green-400 to-green-500' : ratio >= 0.6 ? 'bg-yellow-500' : 'bg-red-500';
  const displayCurrent = format === 'percent' ? `${(current * 100).toFixed(1)}%` : current.toLocaleString();
  const displayGoal = format === 'percent' ? `${(goal * 100).toFixed(0)}%` : goal.toLocaleString();

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="tabular-nums text-gray-500">{displayCurrent} / {displayGoal}</span>
      </div>
      <div className="w-full h-3.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-0.5 text-right">{(ratio * 100).toFixed(0)}% 達成</p>
    </div>
  );
}

// ── Pipeline Step Icons ─────────────────────────────────────────────────

const PIPELINE_ICONS: Record<string, { color: string; bg: string; icon: JSX.Element }> = {
  acquisition: {
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
  activation: {
    color: 'text-green-600',
    bg: 'bg-green-50',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  retention: {
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  referral: {
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
  },
  revenue: {
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

const PIPELINE_STEPS = [
  { key: 'acquisition', label: 'Acquisition', sub: '獲得' },
  { key: 'activation', label: 'Activation', sub: '活性化' },
  { key: 'retention', label: 'Retention', sub: '継続' },
  { key: 'referral', label: 'Referral', sub: '紹介' },
  { key: 'revenue', label: 'Revenue', sub: '収益' },
] as const;

function PipelineOverview({ activationCount, retentionD1, retentionD1Users, retentionD1Size, ga4Sessions, cwsSessions }: { activationCount: number; retentionD1: number | null; retentionD1Users?: number; retentionD1Size?: number; ga4Sessions?: number; cwsSessions?: number }) {
  const acqParts: string[] = [];
  if (ga4Sessions !== undefined) acqParts.push(`LP:${ga4Sessions.toLocaleString()}`);
  if (cwsSessions !== undefined) acqParts.push(`CWS:${cwsSessions.toLocaleString()}`);
  const retentionLabel = retentionD1 !== null
    ? retentionD1Users !== undefined && retentionD1Size !== undefined
      ? `${(retentionD1 * 100).toFixed(0)}% (${retentionD1Users}/${retentionD1Size})`
      : `${(retentionD1 * 100).toFixed(0)}%`
    : '-';
  const values: Record<string, string> = {
    acquisition: acqParts.length > 0 ? acqParts.join(' / ') : '未連携',
    activation: `${activationCount}`,
    retention: retentionLabel,
    referral: 'スコープ外',
    revenue: 'スコープ外',
  };

  return (
    <div className="admin-card p-5">
      <h3 className="text-lg font-bold text-gray-800 mb-1">AARRR パイプライン</h3>
      <p className="text-xs text-gray-400 mb-4">ユーザー獲得から収益化までの各ステージ</p>
      <div className="flex items-center gap-1 overflow-x-auto">
        {PIPELINE_STEPS.map((step, i) => {
          const iconCfg = PIPELINE_ICONS[step.key];
          const isDisabled = step.key === 'referral' || step.key === 'revenue';
          return (
            <div key={step.key} className="flex items-center">
              <div className={`flex flex-col items-center px-3 py-2 rounded-lg min-w-[90px] ${
                isDisabled ? 'bg-gray-50 text-gray-400' : iconCfg.bg
              }`}>
                <span className={isDisabled ? 'text-gray-300' : iconCfg.color}>{iconCfg.icon}</span>
                <span className={`text-xs font-medium mt-1 ${isDisabled ? 'text-gray-400' : iconCfg.color}`}>{step.label}</span>
                <span className="text-[10px] text-gray-400">{step.sub}</span>
                <span className="text-sm font-bold mt-1 tabular-nums">{values[step.key]}</span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <svg className="w-4 h-4 text-gray-300 mx-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SessionAreaChart (GA4 sessions — time series trend) ──────────────────

function SessionAreaChart({ data }: { data: { label: string; value: number }[] }) {
  const chartData = data.map(d => ({ name: d.label.slice(5), value: d.value }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="sessionGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <Tooltip {...CHART_TOOLTIP_STYLE} />
        <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2}
              fill="url(#sessionGradient)" animationDuration={800} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── RechartBarChart (daily signups — discrete counts) ────────────────────

function RechartBarChart({ data }: { data: { label: string; value: number }[] }) {
  const chartData = data.map(d => ({ name: d.label.slice(5), value: d.value }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <Tooltip {...CHART_TOOLTIP_STYLE} />
        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} animationDuration={800} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Main Section ────────────────────────────────────────────────────────

export function AARRRSection({ aarrr, ga4 }: { aarrr: AARRRData; ga4: GA4MetricsResponse }) {
  const [acquisitionInput, setAcquisitionInput] = useState('');
  const acquisitionValue = parseInt(acquisitionInput, 10) || 0;

  const last7 = aarrr.activation.slice(-7);
  const weeklySignups = last7.reduce((sum, d) => sum + d.signupCount, 0);

  const retentionMap = new Map(aarrr.retention.map(r => [r.dayMark, r]));
  const d1 = retentionMap.get('D1');
  const d3 = retentionMap.get('D3');
  const d7 = retentionMap.get('D7');

  const ga4TotalSessions = ga4.configured && ga4.rows.length > 0
    ? ga4.rows.reduce((sum, r) => sum + r.sessions, 0)
    : undefined;
  const ga4TotalUsers = ga4.configured && ga4.rows.length > 0
    ? ga4.rows.reduce((sum, r) => sum + r.totalUsers, 0)
    : undefined;
  const ga4TotalNewUsers = ga4.configured && ga4.rows.length > 0
    ? ga4.rows.reduce((sum, r) => sum + r.newUsers, 0)
    : undefined;

  const cwsTotalSessions = ga4.cwsConfigured && ga4.cwsRows.length > 0
    ? ga4.cwsRows.reduce((sum, r) => sum + r.sessions, 0)
    : undefined;
  const cwsTotalNewUsers = ga4.cwsConfigured && ga4.cwsRows.length > 0
    ? ga4.cwsRows.reduce((sum, r) => sum + r.newUsers, 0)
    : undefined;

  return (
    <div className="space-y-6">
      {/* Pipeline Overview */}
      <PipelineOverview
        activationCount={weeklySignups}
        retentionD1={d1?.rate ?? null}
        retentionD1Users={d1?.retainedUsers}
        retentionD1Size={d1?.cohortSize}
        ga4Sessions={ga4TotalSessions}
        cwsSessions={cwsTotalSessions}
      />

      {/* Acquisition Card */}
      <div className="admin-card p-5 space-y-3">
        <h3 className="text-lg font-bold text-gray-800">Acquisition（獲得）</h3>
        {ga4.configured && ga4.rows.length > 0 ? (
          <>
            <GoalProgressBar
              current={ga4TotalSessions!}
              goal={AARRR_GOALS.acquisition}
              label="月間セッション数"
            />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-500 text-xs">Total Users</span>
                <p className="font-bold tabular-nums">{ga4TotalUsers!.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-500 text-xs">New Users</span>
                <p className="font-bold tabular-nums">{ga4TotalNewUsers!.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-2">日別セッション数</p>
              <SessionAreaChart data={ga4.rows.map(r => ({ label: r.date, value: r.sessions }))} />
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-gray-400">
              {ga4.configured === false ? 'GA4未連携 — Edge Function シークレットを設定してください。' : 'GA4データがありません。'}
              {' '}手動入力で目標との比較が可能です。
            </p>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 whitespace-nowrap">月間LP訪問数:</label>
              <input
                type="number"
                min={0}
                value={acquisitionInput}
                onChange={e => setAcquisitionInput(e.target.value)}
                placeholder="0"
                className="input-field w-32"
              />
            </div>
            {acquisitionValue > 0 && (
              <GoalProgressBar
                current={acquisitionValue}
                goal={AARRR_GOALS.acquisition}
                label="月間LP訪問数"
              />
            )}
          </>
        )}
      </div>

      {/* Chrome Extension Card */}
      <div className="admin-card p-5 space-y-3">
        <h3 className="text-lg font-bold text-gray-800">Chrome拡張</h3>
        <p className="text-xs text-gray-400">user_events テーブルから集計（session.start / アクティブユーザー / 初回利用）</p>
        {ga4.cwsRows.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <GoalProgressBar
                current={cwsTotalSessions ?? 0}
                goal={AARRR_GOALS.cwsSessions}
                label="月間セッション数"
              />
              <GoalProgressBar
                current={cwsTotalNewUsers ?? 0}
                goal={AARRR_GOALS.cwsInstalls}
                label="新規ユーザー数"
              />
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-2">日別アクティブユーザー数</p>
              <SessionAreaChart data={ga4.cwsRows.map(r => ({ label: r.date, value: r.totalUsers }))} />
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-400">拡張の利用データがまだありません。</p>
        )}
      </div>

      {/* Activation Card */}
      <div className="admin-card p-5 space-y-3">
        <h3 className="text-lg font-bold text-gray-800">Activation（活性化）</h3>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold tabular-nums text-gray-900">{weeklySignups}</span>
          <span className="text-sm text-gray-500">件 / 直近7日の新規登録</span>
        </div>
        <GoalProgressBar
          current={weeklySignups}
          goal={AARRR_GOALS.activationWeekly}
          label="週間新規登録数"
        />
        {last7.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">日別新規登録数</p>
            <RechartBarChart data={last7.map(d => ({ label: d.date, value: d.signupCount }))} />
          </div>
        )}
      </div>

      {/* Retention Card */}
      <div className="admin-card p-5 space-y-3">
        <h3 className="text-lg font-bold text-gray-800">Retention（継続）</h3>
        <p className="text-xs text-gray-400 mb-2">サインアップ後 D1/D3/D7 にセッション or ページビューがあった割合</p>
        <div className="space-y-3">
          <GoalProgressBar
            current={d1?.rate ?? 0}
            goal={AARRR_GOALS.retentionD1}
            label={`D1 リテンション${d1 ? ` (${d1.retainedUsers}/${d1.cohortSize})` : ''}`}
            format="percent"
          />
          <GoalProgressBar
            current={d3?.rate ?? 0}
            goal={AARRR_GOALS.retentionD3}
            label={`D3 リテンション${d3 ? ` (${d3.retainedUsers}/${d3.cohortSize})` : ''}`}
            format="percent"
          />
          <GoalProgressBar
            current={d7?.rate ?? 0}
            goal={AARRR_GOALS.retentionD7}
            label={`D7 リテンション${d7 ? ` (${d7.retainedUsers}/${d7.cohortSize})` : ''}`}
            format="percent"
          />
        </div>
      </div>

      {/* Referral & Revenue */}
      <div className="grid grid-cols-2 gap-4">
        <div className="admin-card p-5 text-center">
          <h3 className="text-base font-semibold text-gray-400">Referral（紹介）</h3>
          <p className="text-xs text-gray-300 mt-2">スコープ外 — 今後対応予定</p>
        </div>
        <div className="admin-card p-5 text-center">
          <h3 className="text-base font-semibold text-gray-400">Revenue（収益）</h3>
          <p className="text-xs text-gray-300 mt-2">スコープ外 — 今後対応予定</p>
        </div>
      </div>
    </div>
  );
}
