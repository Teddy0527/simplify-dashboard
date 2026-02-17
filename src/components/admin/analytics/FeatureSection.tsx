import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { FeatureAdoption } from '@jobsimplify/shared';
import { EmptyCard } from './shared';
import { FEATURE_LABELS } from './constants';

function CustomFeatureTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; rate: number; adopted: number; total: number; avgUsage: number } }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-gray-700 mb-1">{d.name}</p>
      <p className="text-gray-500">採用率: <span className="font-medium text-gray-800">{d.rate}%</span></p>
      <p className="text-gray-500">採用人数: <span className="font-medium text-gray-800">{d.adopted}/{d.total}人</span></p>
      <p className="text-gray-500">平均使用回数: <span className="font-medium text-gray-800">{d.avgUsage}回</span></p>
    </div>
  );
}

export function FeatureAdoptionSection({ features }: { features: FeatureAdoption[] }) {
  if (features.length === 0) {
    return <EmptyCard message="機能採用データがありません" />;
  }

  const chartData = features.map((f) => ({
    name: FEATURE_LABELS[f.featureName] ?? f.featureName,
    rate: Math.round(f.adoptionRate * 100),
    adopted: f.adoptedUsers,
    total: f.totalUsers,
    avgUsage: f.avgUsageCount,
  }));

  return (
    <div className="admin-card px-5 py-4">
      <p className="text-xs font-medium text-gray-500 mb-4">機能別採用率</p>
      <ResponsiveContainer width="100%" height={features.length * 48 + 20}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 30, left: 120, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={115} />
          <Tooltip content={<CustomFeatureTooltip />} />
          <Bar dataKey="rate" fill="#6366f1" radius={[0, 4, 4, 0]} animationDuration={800} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
