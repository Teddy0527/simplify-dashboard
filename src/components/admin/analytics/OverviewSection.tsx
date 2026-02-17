import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type {
  UserAnalyticsSummary,
  AggregateTrend,
  EngagementMetrics,
  ActivationFunnelStep,
} from '@jobsimplify/shared';
import { SummaryCard, EmptyCard, computeTrend, CHART_TOOLTIP_STYLE } from './shared';
import { HEALTH_THRESHOLDS, FUNNEL_STEP_LABELS } from './constants';

// SVG Icons for SummaryCards
const UsersIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const ActiveIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);
const EventsIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export function OverviewSection({
  users,
  trends,
  engagement,
  funnel,
  fetchedAt,
}: {
  users: UserAnalyticsSummary[];
  trends: AggregateTrend[];
  engagement: EngagementMetrics[];
  funnel: ActivationFunnelStep[];
  fetchedAt: Date | null;
}) {
  const totalUsers = users.length;
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const activeUsers = users.filter((u) => u.lastActiveAt && u.lastActiveAt >= sevenDaysAgo).length;
  const totalEvents = users.reduce((sum, u) => sum + u.totalEvents, 0);

  const latestEngagement = engagement.length > 0 ? engagement[engagement.length - 1] : null;

  const { dauTrend, wauTrend, mauTrend } = useMemo(() => {
    if (engagement.length < 2) return { dauTrend: null, wauTrend: null, mauTrend: null };
    const today = new Date().toISOString().slice(0, 10);
    const confirmed = engagement.filter(e => e.day < today);
    if (confirmed.length < 2) return { dauTrend: null, wauTrend: null, mauTrend: null };
    const prev = confirmed[confirmed.length - 2];
    const curr = confirmed[confirmed.length - 1];
    return {
      dauTrend: computeTrend(curr.dau, prev.dau),
      wauTrend: computeTrend(curr.wau, prev.wau),
      mauTrend: computeTrend(curr.mau, prev.mau),
    };
  }, [engagement]);

  const healthStatus = useMemo(() => {
    const stickiness = latestEngagement && latestEngagement.mau > 0
      ? latestEngagement.dau / latestEngagement.mau
      : 0;
    const step3 = funnel.length >= 3 ? funnel[2].reachRate : 0;

    return {
      stickiness: {
        value: Math.round(stickiness * 100),
        status: stickiness >= HEALTH_THRESHOLDS.stickiness.good ? 'good' as const
          : stickiness >= HEALTH_THRESHOLDS.stickiness.warn ? 'warn' as const
          : 'danger' as const,
      },
      funnelStep3: {
        value: Math.round(step3 * 100),
        status: step3 >= HEALTH_THRESHOLDS.funnelStep3.good ? 'good' as const
          : step3 >= HEALTH_THRESHOLDS.funnelStep3.warn ? 'warn' as const
          : 'danger' as const,
      },
    };
  }, [latestEngagement, funnel]);

  return (
    <>
      {fetchedAt && (
        <p className="text-xs text-gray-400 text-right">
          最終取得: {fetchedAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}

      {/* Health status cards */}
      <div className="grid grid-cols-2 gap-4">
        <HealthCard
          label="スティッキネス (DAU/MAU)"
          value={`${healthStatus.stickiness.value}%`}
          status={healthStatus.stickiness.status}
        />
        <HealthCard
          label="ファネル Step3 到達率"
          value={`${healthStatus.funnelStep3.value}%`}
          status={healthStatus.funnelStep3.status}
        />
      </div>

      {/* Summary cards with icons */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="合計ユーザー" value={totalUsers} icon={UsersIcon} />
        <SummaryCard label="アクティブ（7日）" value={activeUsers} icon={ActiveIcon} />
        <SummaryCard label="総イベント数" value={totalEvents} icon={EventsIcon} />
      </div>

      {/* DAU/WAU/MAU with trends */}
      {latestEngagement && (
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard label="DAU（今日）" value={latestEngagement.dau} trend={dauTrend} />
          <SummaryCard label="WAU（7日）" value={latestEngagement.wau} trend={wauTrend} />
          <SummaryCard label="MAU（30日）" value={latestEngagement.mau} trend={mauTrend} />
        </div>
      )}

      {/* Mini funnel */}
      {funnel.length > 0 && <MiniFunnel funnel={funnel} />}

      {/* Activity bar chart (14 days) — Recharts */}
      <ActivityChart trends={trends} />
    </>
  );
}

// Health status card with SVG icon + border-l-4 accent
function HealthCard({ label, value, status }: {
  label: string;
  value: string;
  status: 'good' | 'warn' | 'danger';
}) {
  const config = {
    good: {
      border: 'border-l-green-500',
      text: 'text-green-700',
      icon: (
        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconLabel: '良好',
    },
    warn: {
      border: 'border-l-yellow-500',
      text: 'text-yellow-700',
      icon: (
        <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconLabel: '注意',
    },
    danger: {
      border: 'border-l-red-500',
      text: 'text-red-700',
      icon: (
        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconLabel: '警告',
    },
  }[status];

  return (
    <div
      className={`admin-card border-l-4 ${config.border} flex items-center gap-3`}
      aria-label={`${label}: ${value} - ${config.iconLabel}`}
    >
      {config.icon}
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xl font-bold tabular-nums ${config.text}`}>{value}</span>
          <span className={`text-xs ${config.text}`}>{config.iconLabel}</span>
        </div>
      </div>
    </div>
  );
}

// Mini funnel (one-line bar summary)
function MiniFunnel({ funnel }: { funnel: ActivationFunnelStep[] }) {
  const maxCount = Math.max(...funnel.map(f => f.reachedCount), 1);

  return (
    <div className="admin-card px-5 py-4">
      <p className="text-xs text-gray-500 mb-3 font-medium">アクティベーションファネル概要</p>
      <div className="space-y-2">
        {funnel.map((step, i) => {
          const pct = Math.round(step.reachRate * 100);
          const label = FUNNEL_STEP_LABELS[step.stepName] ?? step.stepName;
          return (
            <div key={step.stepName} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-4 text-right tabular-nums">{i + 1}</span>
              <span className="text-xs text-gray-600 w-28 truncate">{label}</span>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${pct >= 50 ? 'bg-green-500' : pct >= 20 ? 'bg-yellow-500' : 'bg-red-400'}`}
                  style={{ width: `${(step.reachedCount / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 tabular-nums w-8 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityChart({ trends }: { trends: AggregateTrend[] }) {
  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of trends) {
      map.set(t.day, (map.get(t.day) ?? 0) + t.eventCount);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([day, count]) => ({ day: day.slice(5), count }));
  }, [trends]);

  if (chartData.length === 0) {
    return <EmptyCard message="アクティビティデータがありません" />;
  }

  return (
    <div className="admin-card px-5 py-4">
      <p className="text-xs text-gray-500 mb-3 font-medium">直近14日のアクティビティ</p>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip {...CHART_TOOLTIP_STYLE} />
          <Area type="monotone" dataKey="count" name="イベント" stroke="#6366f1"
                strokeWidth={2} fill="url(#activityGradient)" animationDuration={800} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
