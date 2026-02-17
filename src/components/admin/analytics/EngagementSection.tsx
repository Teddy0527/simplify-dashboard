import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { EngagementMetrics } from '@jobsimplify/shared';
import { SummaryCard, EmptyCard, computeTrend, CHART_TOOLTIP_STYLE } from './shared';

const StickinessIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);
const CalendarIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export function EngagementSection({ engagement }: { engagement: EngagementMetrics[] }) {
  if (engagement.length === 0) {
    return <EmptyCard message="エンゲージメントデータがありません" />;
  }

  const latest = engagement[engagement.length - 1];
  const stickiness = latest && latest.mau > 0
    ? Math.round((latest.dau / latest.mau) * 100)
    : 0;

  const stickinessTrend = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const confirmed = engagement.filter(e => e.day < today);
    if (confirmed.length < 2) return null;
    const prev = confirmed[confirmed.length - 2];
    const curr = confirmed[confirmed.length - 1];
    const prevStickiness = prev.mau > 0 ? Math.round((prev.dau / prev.mau) * 100) : undefined;
    const currStickiness = curr.mau > 0 ? Math.round((curr.dau / curr.mau) * 100) : undefined;
    return computeTrend(currStickiness, prevStickiness);
  }, [engagement]);

  const chartData = useMemo(() =>
    engagement.map(e => ({
      day: e.day.slice(5),
      DAU: e.dau,
      WAU: e.wau,
      MAU: e.mau,
    })),
    [engagement],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <SummaryCard label="DAU/MAU スティッキネス" value={stickiness} suffix="%" trend={stickinessTrend} icon={StickinessIcon} />
        <SummaryCard label="データ期間" value={engagement.length} suffix="日" icon={CalendarIcon} />
      </div>

      <div className="admin-card px-5 py-4">
        <p className="text-xs text-gray-500 mb-3 font-medium">DAU / WAU / MAU 推移（30日）</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              interval={engagement.length > 14 ? Math.floor(engagement.length / 7) : 0}
            />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip {...CHART_TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="DAU" stroke="#6366f1" strokeWidth={2} dot={false} animationDuration={800} />
            <Line type="monotone" dataKey="WAU" stroke="#f59e0b" strokeWidth={2} dot={false} animationDuration={800} />
            <Line type="monotone" dataKey="MAU" stroke="#10b981" strokeWidth={2} dot={false} animationDuration={800} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
