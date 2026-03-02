import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { AutofillDailyMetrics, AutofillSiteRanking } from '@jobsimplify/shared';
import { SummaryCard, computeTrend, CHART_TOOLTIP_STYLE, EmptyCard } from './shared';

interface AutofillSectionProps {
  metrics: AutofillDailyMetrics[];
  sites: AutofillSiteRanking[];
}

export function AutofillSection({ metrics, sites }: AutofillSectionProps) {
  const { chartData, kpi } = useMemo(() => {
    if (metrics.length === 0) {
      return {
        chartData: [],
        kpi: { totalRuns: 0, successRate: 0, filledFields: 0, peakDau: 0, runsTrend: null as number | null, fieldsTrend: null as number | null },
      };
    }

    const chartData = metrics.map((m) => ({
      date: m.date.slice(5), // MM-DD
      success: m.success,
      errors: m.errors,
      uniqueUsers: m.uniqueUsers,
    }));

    const totalRuns = metrics.reduce((s, m) => s + m.totalRuns, 0);
    const totalSuccess = metrics.reduce((s, m) => s + m.success, 0);
    const successRate = totalRuns > 0 ? Math.round((totalSuccess / totalRuns) * 100) : 0;
    const filledFields = metrics.reduce((s, m) => s + m.filledFields, 0);
    const peakDau = Math.max(...metrics.map((m) => m.uniqueUsers));

    // Trend: second half vs first half
    const half = Math.floor(metrics.length / 2);
    const firstHalfRuns = metrics.slice(0, half).reduce((s, m) => s + m.totalRuns, 0);
    const secondHalfRuns = metrics.slice(half).reduce((s, m) => s + m.totalRuns, 0);
    const firstHalfFields = metrics.slice(0, half).reduce((s, m) => s + m.filledFields, 0);
    const secondHalfFields = metrics.slice(half).reduce((s, m) => s + m.filledFields, 0);

    return {
      chartData,
      kpi: {
        totalRuns,
        successRate,
        filledFields,
        peakDau,
        runsTrend: computeTrend(secondHalfRuns, firstHalfRuns),
        fieldsTrend: computeTrend(secondHalfFields, firstHalfFields),
      },
    };
  }, [metrics]);

  if (metrics.length === 0 && sites.length === 0) {
    return <EmptyCard message="オートフィルデータがまだありません" />;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="実行回数" value={kpi.totalRuns} trend={kpi.runsTrend} />
        <SummaryCard label="成功率" value={kpi.successRate} suffix="%" />
        <SummaryCard label="入力フィールド数" value={kpi.filledFields} trend={kpi.fieldsTrend} />
        <SummaryCard label="ピークDAU" value={kpi.peakDau} />
      </div>

      {/* Daily Chart */}
      {chartData.length > 0 && (
        <div className="admin-card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">日別オートフィル実行数</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Legend />
              <Bar dataKey="success" name="成功" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
              <Bar dataKey="errors" name="エラー" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Site Ranking Table */}
      {sites.length > 0 && (
        <div className="admin-card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">サイト別ランキング</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-3 py-3">#</th>
                  <th className="px-3 py-3">ドメイン</th>
                  <th className="px-3 py-3 text-right">実行回数</th>
                  <th className="px-3 py-3 text-right">ユーザー数</th>
                  <th className="px-3 py-3 text-right">入力フィールド</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site, i) => (
                  <tr key={site.domain} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-400 tabular-nums">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-800">{site.domain}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{site.totalRuns.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{site.uniqueUsers.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{site.filledFields.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
