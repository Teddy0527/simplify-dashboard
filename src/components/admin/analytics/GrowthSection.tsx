import { useMemo } from 'react';
import {
  BarChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { AARRRData, GA4MetricsResponse, ExtensionDailyMetrics } from '@jobsimplify/shared';
import { SummaryCard, computeTrend, CHART_TOOLTIP_STYLE } from './shared';
import { normalizeGA4Date } from '../../../hooks/useAnalyticsV2';

interface GrowthSectionProps {
  aarrr: AARRRData;
  ga4: GA4MetricsResponse;
  extensionMetrics: ExtensionDailyMetrics[];
}

export function GrowthSection({ aarrr, ga4, extensionMetrics }: GrowthSectionProps) {
  // Build LP + signup merged data from GA4 rows and AARRR activation
  const { lpSignupData, kpi } = useMemo(() => {
    const signupMap = new Map(aarrr.activation.map((d) => [d.date, d.signupCount]));

    if (ga4.configured && ga4.rows.length > 0) {
      // Join GA4 visitors with signups by date
      const merged = ga4.rows.map((r) => {
        const date = normalizeGA4Date(r.date);
        return {
          date: date.slice(5), // MM-DD for display
          visitors: r.totalUsers,
          signups: signupMap.get(date) ?? 0,
        };
      });

      let cumVisitors = 0;
      let cumSignups = 0;
      const finalData = merged.map((d) => {
        cumVisitors += d.visitors;
        cumSignups += d.signups;
        return { ...d, cumulativeVisitors: cumVisitors, cumulativeSignups: cumSignups };
      });

      const totalVisitors = ga4.rows.reduce((s, r) => s + r.totalUsers, 0);
      const totalSignups = aarrr.activation.reduce((s, d) => s + d.signupCount, 0);
      const conversionRate = totalVisitors > 0 ? (totalSignups / totalVisitors) * 100 : 0;

      // Trend: compare last half vs first half
      const half = Math.floor(ga4.rows.length / 2);
      const firstHalfVisitors = ga4.rows.slice(0, half).reduce((s, r) => s + r.totalUsers, 0);
      const secondHalfVisitors = ga4.rows.slice(half).reduce((s, r) => s + r.totalUsers, 0);
      const firstHalfSignups = aarrr.activation.slice(0, half).reduce((s, d) => s + d.signupCount, 0);
      const secondHalfSignups = aarrr.activation.slice(half).reduce((s, d) => s + d.signupCount, 0);

      return {
        lpSignupData: finalData,
        kpi: {
          totalVisitors,
          totalSignups,
          conversionRate,
          visitorsTrend: computeTrend(secondHalfVisitors, firstHalfVisitors),
          signupsTrend: computeTrend(secondHalfSignups, firstHalfSignups),
        },
      };
    }

    // GA4 not configured: signups only
    let cumSignups = 0;
    const signupOnly = aarrr.activation.map((d) => {
      cumSignups += d.signupCount;
      return { date: d.date.slice(5), visitors: 0, signups: d.signupCount, cumulativeVisitors: 0, cumulativeSignups: cumSignups };
    });
    const totalSignups = aarrr.activation.reduce((s, d) => s + d.signupCount, 0);
    const half = Math.floor(aarrr.activation.length / 2);
    const firstHalf = aarrr.activation.slice(0, half).reduce((s, d) => s + d.signupCount, 0);
    const secondHalf = aarrr.activation.slice(half).reduce((s, d) => s + d.signupCount, 0);

    return {
      lpSignupData: signupOnly,
      kpi: {
        totalVisitors: 0,
        totalSignups,
        conversionRate: 0,
        visitorsTrend: null,
        signupsTrend: computeTrend(secondHalf, firstHalf),
      },
    };
  }, [aarrr, ga4]);

  // CWS data
  const { cwsData, cwsKpi } = useMemo(() => {
    if (extensionMetrics.length === 0) {
      return { cwsData: [], cwsKpi: { totalActive: 0, totalNew: 0, activeTrend: null, newTrend: null } };
    }

    let cumActive = 0;
    let cumNew = 0;
    const data = extensionMetrics.map((d) => {
      cumActive += d.totalUsers;
      cumNew += d.newUsers;
      return {
        date: d.date.slice(5),
        activeUsers: d.totalUsers,
        newUsers: d.newUsers,
        cumulativeActive: cumActive,
        cumulativeNew: cumNew,
      };
    });

    const totalActive = extensionMetrics.reduce((s, d) => s + d.totalUsers, 0);
    const totalNew = extensionMetrics.reduce((s, d) => s + d.newUsers, 0);
    const half = Math.floor(extensionMetrics.length / 2);
    const firstActive = extensionMetrics.slice(0, half).reduce((s, d) => s + d.totalUsers, 0);
    const secondActive = extensionMetrics.slice(half).reduce((s, d) => s + d.totalUsers, 0);
    const firstNew = extensionMetrics.slice(0, half).reduce((s, d) => s + d.newUsers, 0);
    const secondNew = extensionMetrics.slice(half).reduce((s, d) => s + d.newUsers, 0);

    return {
      cwsData: data,
      cwsKpi: {
        totalActive,
        totalNew,
        activeTrend: computeTrend(secondActive, firstActive),
        newTrend: computeTrend(secondNew, firstNew),
      },
    };
  }, [extensionMetrics]);

  const ga4Configured = ga4.configured && ga4.rows.length > 0;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {ga4Configured && (
          <SummaryCard label="LP訪問者" value={kpi.totalVisitors} trend={kpi.visitorsTrend} />
        )}
        <SummaryCard label="登録数" value={kpi.totalSignups} trend={kpi.signupsTrend} />
        {ga4Configured && (
          <SummaryCard
            label="LP→登録転換率"
            value={Math.round(kpi.conversionRate * 10) / 10}
            suffix="%"
          />
        )}
        {cwsKpi.totalActive > 0 && (
          <>
            <SummaryCard label="CWSアクティブ" value={cwsKpi.totalActive} trend={cwsKpi.activeTrend} />
            <SummaryCard label="CWS新規" value={cwsKpi.totalNew} trend={cwsKpi.newTrend} />
          </>
        )}
      </div>

      {/* LP + Signup Charts */}
      <div className="admin-card px-5 py-4">
        <p className="text-xs font-medium text-gray-500 mb-4">
          {ga4Configured ? 'LP訪問者 + 新規登録' : '新規登録数'}
        </p>
        {lpSignupData.length > 0 ? (
          <div className="space-y-6">
            {/* Daily Bar Chart */}
            <div>
              <p className="text-[11px] text-gray-400 mb-2">日別</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={lpSignupData} margin={{ top: 4, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: '人数（人/日）', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#9ca3af' }, offset: 0 }}
                  />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {ga4Configured && (
                    <Bar dataKey="visitors" name="日別LP訪問" fill="#93c5fd" radius={[2, 2, 0, 0]} />
                  )}
                  <Bar dataKey="signups" name="日別登録" fill="#86efac" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Cumulative Line Chart */}
            <div>
              <p className="text-[11px] text-gray-400 mb-2">累計</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={lpSignupData} margin={{ top: 4, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: '累計人数（人）', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#9ca3af' }, offset: 0 }}
                  />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {ga4Configured && (
                    <Line type="monotone" dataKey="cumulativeVisitors" name="累計LP訪問" stroke="#3b82f6" dot={false} strokeWidth={2} />
                  )}
                  <Line type="monotone" dataKey="cumulativeSignups" name="累計登録" stroke="#22c55e" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">データがありません</p>
        )}
        {!ga4Configured && (
          <p className="text-xs text-gray-400 mt-2">
            GA4未連携 — Edge Function シークレットを設定するとLP訪問者数も表示されます。
          </p>
        )}
      </div>

      {/* CWS Extension Charts */}
      {cwsData.length > 0 && (
        <div className="admin-card px-5 py-4">
          <div className="flex items-center gap-2 mb-4">
            <p className="text-xs font-medium text-gray-500">Chrome拡張 アクティブ / 新規ユーザー</p>
            <span className="text-[10px] text-gray-400">※拡張機能内計測。Webストア訪問者数ではありません</span>
          </div>
          <div className="space-y-6">
            {/* Daily Bar Chart */}
            <div>
              <p className="text-[11px] text-gray-400 mb-2">日別</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cwsData} margin={{ top: 4, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: '人数（人/日）', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#9ca3af' }, offset: 0 }}
                  />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="activeUsers" name="日別アクティブ" fill="#a5b4fc" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="newUsers" name="日別新規" fill="#fbbf24" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Cumulative Line Chart */}
            <div>
              <p className="text-[11px] text-gray-400 mb-2">累計</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={cwsData} margin={{ top: 4, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: '累計人数（人）', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#9ca3af' }, offset: 0 }}
                  />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="cumulativeActive" name="累計アクティブ" stroke="#6366f1" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="cumulativeNew" name="累計新規" stroke="#f59e0b" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
