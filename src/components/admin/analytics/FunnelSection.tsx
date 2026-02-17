import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { ActivationFunnelStep, RetentionCohort } from '@jobsimplify/shared';
import { EmptyCard } from './shared';
import { FUNNEL_STEP_LABELS } from './constants';

const STEP_HEX_COLORS = [
  '#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#ef4444',
  '#14b8a6', '#ec4899', '#6366f1',
];

function CustomFunnelTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; count: number; rate: number; median: number | null } }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-gray-700 mb-1">{d.name}</p>
      <p className="text-gray-500">到達率: <span className="font-medium text-gray-800">{d.rate}%</span></p>
      <p className="text-gray-500">到達人数: <span className="font-medium text-gray-800">{d.count}人</span></p>
      {d.median !== null && d.median > 0 && (
        <p className="text-gray-500">中央値: <span className="font-medium text-gray-800">{d.median.toFixed(1)}日</span></p>
      )}
    </div>
  );
}

export function FunnelSection({ funnel }: { funnel: ActivationFunnelStep[] }) {
  if (funnel.length === 0) {
    return <EmptyCard message="ファネルデータがありません" />;
  }

  const chartData = funnel.map((step) => ({
    name: FUNNEL_STEP_LABELS[step.stepName] ?? step.stepName,
    count: step.reachedCount,
    rate: Math.round(step.reachRate * 100),
    median: step.medianDaysToReach,
  }));

  return (
    <div className="admin-card px-5 py-4">
      <p className="text-xs font-medium text-gray-500 mb-4">アクティベーションファネル（90日）</p>
      <ResponsiveContainer width="100%" height={funnel.length * 52 + 20}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 30, left: 120, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={115} />
          <Tooltip content={<CustomFunnelTooltip />} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} animationDuration={800}>
            {chartData.map((_, i) => <Cell key={i} fill={STEP_HEX_COLORS[i % STEP_HEX_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CohortSection({ cohorts }: { cohorts: RetentionCohort[] }) {
  const matrix = useMemo(() => {
    const weeks = new Map<string, Map<number, RetentionCohort>>();
    for (const c of cohorts) {
      if (!weeks.has(c.cohortWeek)) weeks.set(c.cohortWeek, new Map());
      weeks.get(c.cohortWeek)!.set(c.weekNumber, c);
    }
    return weeks;
  }, [cohorts]);

  if (matrix.size === 0) {
    return <EmptyCard message="コホートデータがありません" />;
  }

  const cohortWeeks = [...matrix.keys()].sort();
  const maxWeekNum = Math.max(...cohorts.map((c) => c.weekNumber), 0);
  const weekNums = Array.from({ length: maxWeekNum + 1 }, (_, i) => i);

  return (
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
  );
}
