import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { RetentionTrendPoint, RetentionCohort } from '@jobsimplify/shared';
import { SummaryCard, computeTrend, CHART_TOOLTIP_STYLE, EmptyCard } from './shared';

interface RetentionSectionProps {
  retentionTrend: RetentionTrendPoint[];
  cohorts: RetentionCohort[];
}

export function RetentionSection({ retentionTrend, cohorts }: RetentionSectionProps) {
  // Find latest and previous mature cohorts for KPIs
  const { latestMature, prevMature } = useMemo(() => {
    const matureD1 = retentionTrend.filter((p) => p.isD1Mature);
    const latest = matureD1.length > 0 ? matureD1[matureD1.length - 1] : null;
    const prev = matureD1.length > 1 ? matureD1[matureD1.length - 2] : null;
    return { latestMature: latest, prevMature: prev };
  }, [retentionTrend]);

  // Chart data: show all points, mature vs immature
  const chartData = useMemo(() => {
    return retentionTrend.map((p) => ({
      week: p.cohortWeek.slice(5), // MM-DD
      d1: Math.round(p.d1Rate * 100),
      d3: Math.round(p.d3Rate * 100),
      d7: Math.round(p.d7Rate * 100),
      isD1Mature: p.isD1Mature,
      isD3Mature: p.isD3Mature,
      isD7Mature: p.isD7Mature,
    }));
  }, [retentionTrend]);

  // Cohort heatmap
  const matrix = useMemo(() => {
    const weeks = new Map<string, Map<number, RetentionCohort>>();
    for (const c of cohorts) {
      if (!weeks.has(c.cohortWeek)) weeks.set(c.cohortWeek, new Map());
      weeks.get(c.cohortWeek)!.set(c.weekNumber, c);
    }
    return weeks;
  }, [cohorts]);

  const cohortWeeks = [...matrix.keys()].sort();
  const maxWeekNum = cohorts.length > 0 ? Math.max(...cohorts.map((c) => c.weekNumber), 0) : 0;
  const weekNums = Array.from({ length: maxWeekNum + 1 }, (_, i) => i);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {latestMature && (
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard
            label="D1 リテンション"
            value={Math.round(latestMature.d1Rate * 100)}
            suffix="%"
            trend={computeTrend(
              Math.round(latestMature.d1Rate * 100),
              prevMature ? Math.round(prevMature.d1Rate * 100) : undefined,
            )}
          />
          <SummaryCard
            label="D3 リテンション"
            value={Math.round(latestMature.d3Rate * 100)}
            suffix="%"
            trend={computeTrend(
              Math.round(latestMature.d3Rate * 100),
              prevMature ? Math.round(prevMature.d3Rate * 100) : undefined,
            )}
          />
          <SummaryCard
            label="D7 リテンション"
            value={Math.round(latestMature.d7Rate * 100)}
            suffix="%"
            trend={computeTrend(
              Math.round(latestMature.d7Rate * 100),
              prevMature ? Math.round(prevMature.d7Rate * 100) : undefined,
            )}
          />
        </div>
      )}

      {/* Trend Line Chart */}
      {chartData.length > 0 ? (
        <div className="admin-card px-5 py-4">
          <p className="text-xs font-medium text-gray-500 mb-4">D1 / D3 / D7 リテンション推移（週次）</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
              <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(value) => `${value}%`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone" dataKey="d1" name="D1"
                stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }}
                connectNulls
              />
              <Line
                type="monotone" dataKey="d3" name="D3"
                stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }}
                connectNulls
              />
              <Line
                type="monotone" dataKey="d7" name="D7"
                stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-gray-400 mt-1">成熟コホートのみ実線表示</p>
        </div>
      ) : (
        <EmptyCard message="リテンショントレンドデータがありません" />
      )}

      {/* Cohort Heatmap */}
      {matrix.size > 0 ? (
        <div className="admin-card px-5 py-4 overflow-x-auto">
          <p className="text-xs font-medium text-gray-500 mb-3">リテンションコホート（週次）</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 bg-gray-50">
                <th className="text-left pb-2 pr-2 py-2.5 px-2 rounded-l-md font-semibold">コホート</th>
                <th className="text-center pb-2 px-1 py-2.5 font-semibold">サイズ</th>
                {weekNums.map((w) => (
                  <th key={w} className={`text-center pb-2 px-1 py-2.5 font-semibold ${w === weekNums.length - 1 ? 'rounded-r-md' : ''}`}>W{w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohortWeeks.map((week) => {
                const row = matrix.get(week)!;
                const size = row.values().next().value?.cohortSize ?? 0;
                return (
                  <tr key={week}>
                    <td className="text-gray-600 py-1.5 pr-2 whitespace-nowrap">{week.slice(5)}</td>
                    <td className="text-center text-gray-500 py-1.5 px-1 tabular-nums">{size}</td>
                    {weekNums.map((w) => {
                      const cell = row.get(w);
                      if (!cell) return <td key={w} className="py-1.5 px-1" />;
                      const pct = Math.round(cell.retentionRate * 100);
                      const bg = pct >= 90 ? 'bg-green-200 text-green-900'
                        : pct >= 70 ? 'bg-green-100 text-green-800'
                        : pct >= 50 ? 'bg-green-50 text-green-700'
                        : pct >= 30 ? 'bg-yellow-50 text-yellow-700'
                        : pct >= 15 ? 'bg-orange-50 text-orange-600'
                        : 'bg-red-50 text-red-600';
                      return (
                        <td key={w} className={`text-center py-1.5 px-1 tabular-nums rounded-md ${bg}`}>
                          {pct}%
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyCard message="コホートデータがありません" />
      )}
    </div>
  );
}
