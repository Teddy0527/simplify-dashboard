import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { FeaturePopularity } from '@jobsimplify/shared';
import { SummaryCard, EmptyCard } from './shared';

// ── Event type labels ────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<string, string> = {
  'company.create': '企業追加',
  'company.update': '企業編集',
  'company.delete': '企業削除',
  'company.status_change': 'ステータス変更',
  'interaction.drawer_open': 'ドロワーを開く',
  'interaction.drawer_save': 'ドロワー保存',
  'interaction.drawer_close': 'ドロワーを閉じる',
  'interaction.add_modal_open': '追加モーダルを開く',
  'interaction.add_modal_save': '追加モーダル保存',
  'interaction.add_modal_cancel': '追加モーダルキャンセル',
  'interaction.kanban_drag': 'カンバンドラッグ',
  'interaction.filter_use': 'フィルタ使用',
  'interaction.view_mode_change': '表示切替',
  'interaction.search': '検索',
  'page_view.deadlines': '締切DB閲覧',
  'page_view.es': 'ES管理閲覧',
  'page_view.profile': 'プロフィール閲覧',
  'deadline.add_to_tracker': 'Tracker追加',
  'deadline.gcal_add': 'GCal連携',
  'deadline.reminder_set': 'リマインダー設定',
  'deadline.search': '締切検索',
  'entry_sheet.create': 'ES作成',
  'entry_sheet.update': 'ES編集',
  'entry_sheet.delete': 'ES削除',
  'entry_sheet.copy': 'ESコピー',
  'template.create': 'テンプレート作成',
  'template.update': 'テンプレート編集',
  'template.delete': 'テンプレート削除',
  'es_question.create': '質問追加',
  'es_question.update': '質問編集',
  'es_question.delete': '質問削除',
  'profile.update': 'プロフィール更新',
};

// ── Colors per category ──────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  tracker: '#6366f1',
  deadlines: '#f59e0b',
  es: '#10b981',
  profile: '#3b82f6',
  search_filter: '#8b5cf6',
};

const CATEGORY_ICONS: Record<string, string> = {
  tracker: '📋',
  deadlines: '📅',
  es: '📝',
  profile: '👤',
  search_filter: '🔍',
};

// ── Stars helper ─────────────────────────────────────────────────────

function AdoptionStars({ rate }: { rate: number }) {
  const filled = rate >= 0.5 ? 5 : rate >= 0.4 ? 4 : rate >= 0.2 ? 3 : rate >= 0.1 ? 2 : 1;
  return (
    <span className="text-yellow-400 text-xs tracking-wider">
      {'★'.repeat(filled)}{'☆'.repeat(5 - filled)}
    </span>
  );
}

// ── Tooltip ──────────────────────────────────────────────────────────

function CategoryTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; eventCount: number; uniqueUsers: number; totalUsers: number; adoptionRate: number } }>;
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-gray-700 mb-1">{d.name}</p>
      <p className="text-gray-500">イベント数: <span className="font-medium text-gray-800">{d.eventCount.toLocaleString()}</span></p>
      <p className="text-gray-500">ユニークユーザー: <span className="font-medium text-gray-800">{d.uniqueUsers}/{d.totalUsers}人</span></p>
      <p className="text-gray-500">採用率: <span className="font-medium text-gray-800">{Math.round(d.adoptionRate * 100)}%</span></p>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

interface FeaturePopularitySectionProps {
  features: FeaturePopularity[];
}

export function FeaturePopularitySection({ features }: FeaturePopularitySectionProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const totalEvents = useMemo(() => features.reduce((sum, f) => sum + f.eventCount, 0), [features]);
  const totalUsers = features[0]?.totalUsers ?? 0;

  const chartData = useMemo(() => features.map((f) => ({
    name: f.categoryLabel,
    key: f.categoryKey,
    eventCount: f.eventCount,
    uniqueUsers: f.uniqueUsers,
    totalUsers: f.totalUsers,
    adoptionRate: f.adoptionRate,
    pct: totalEvents > 0 ? Math.round((f.eventCount / totalEvents) * 100) : 0,
  })), [features, totalEvents]);

  // Key findings
  const findings = useMemo(() => {
    const items: Array<{ label: string; detail: string; severity: 'high' | 'medium' | 'low' }> = [];
    const top = features[0];
    if (top) {
      const topPct = totalEvents > 0 ? Math.round((top.eventCount / totalEvents) * 100) : 0;
      if (topPct >= 60) {
        items.push({
          label: `${top.categoryLabel}が全体の${topPct}%を占有`,
          detail: '1機能への集中度が非常に高い',
          severity: 'high',
        });
      }
    }

    for (const f of features) {
      if (f.categoryKey === 'deadlines') {
        const actionEvents = f.topEvents.filter((e) =>
          !e.eventType.startsWith('page_view.')
        );
        const actionTotal = actionEvents.reduce((s, e) => s + e.count, 0);
        if (actionTotal === 0 && f.eventCount > 0) {
          items.push({
            label: '締切DBは「見るだけ」',
            detail: `${f.uniqueUsers}人が閲覧するも、Tracker追加・GCal連携は0回`,
            severity: 'high',
          });
        }
      }

      if (f.categoryKey === 'es' && f.adoptionRate < 0.1) {
        items.push({
          label: 'ES管理はほぼ未使用',
          detail: `全${totalUsers}ユーザー中${f.uniqueUsers}人のみ（${Math.round(f.adoptionRate * 100)}%）`,
          severity: 'high',
        });
      }

      if (f.categoryKey === 'profile') {
        const pageViews = f.topEvents.find((e) => e.eventType === 'page_view.profile');
        const updates = f.topEvents.find((e) => e.eventType === 'profile.update');
        if (pageViews && updates && pageViews.count > updates.count * 5) {
          items.push({
            label: 'プロフィールは閲覧 >> 編集',
            detail: `閲覧${pageViews.count}回 vs 更新${updates.count}回`,
            severity: 'medium',
          });
        }
      }

      if (f.categoryKey === 'tracker') {
        const cancelEvt = f.topEvents.find((e) => e.eventType === 'interaction.add_modal_cancel');
        const openEvt = f.topEvents.find((e) => e.eventType === 'interaction.add_modal_open');
        if (cancelEvt && openEvt && openEvt.count > 0) {
          const cancelRate = Math.round((cancelEvt.count / openEvt.count) * 100);
          if (cancelRate >= 40) {
            items.push({
              label: `追加モーダルキャンセル率${cancelRate}%`,
              detail: `${openEvt.count}回の表示に対し${cancelEvt.count}回キャンセル`,
              severity: 'medium',
            });
          }
        }
      }
    }

    return items;
  }, [features, totalEvents, totalUsers]);

  if (features.length === 0) {
    return <EmptyCard message="機能人気度データがありません" />;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          label="総イベント数（5カテゴリ）"
          value={totalEvents}
          subtitle={`${totalUsers}ユーザーから`}
        />
        <SummaryCard
          label="最も利用される機能"
          value={features[0]?.eventCount ?? 0}
          subtitle={features[0]?.categoryLabel}
        />
        <SummaryCard
          label="最も採用率が高い機能"
          value={Math.round((features.reduce((best, f) => f.adoptionRate > best.adoptionRate ? f : best, features[0]).adoptionRate) * 100)}
          suffix="%"
          subtitle={features.reduce((best, f) => f.adoptionRate > best.adoptionRate ? f : best, features[0]).categoryLabel}
        />
      </div>

      {/* Category Bar Chart */}
      <div className="admin-card px-5 py-4">
        <p className="text-xs font-medium text-gray-500 mb-4">カテゴリ別イベント数ランキング</p>
        <ResponsiveContainer width="100%" height={features.length * 56 + 20}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 60, left: 140, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={135} />
            <Tooltip content={<CategoryTooltip />} />
            <Bar dataKey="eventCount" radius={[0, 6, 6, 0]} animationDuration={800} label={{ position: 'right', fontSize: 11, fill: '#6b7280', formatter: ((v: unknown) => typeof v === 'number' ? v.toLocaleString() : String(v ?? '')) as never }}>
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={CATEGORY_COLORS[entry.key] ?? '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Breakdown Table */}
      <div className="admin-card px-5 py-4">
        <p className="text-xs font-medium text-gray-500 mb-3">カテゴリ別詳細</p>
        {/* Header */}
        <div className="grid grid-cols-[1fr_90px_60px_120px_60px_90px] text-gray-500 bg-gray-50 rounded-md text-xs font-semibold">
          <div className="py-2.5 px-3">カテゴリ</div>
          <div className="py-2.5 px-3 text-right">イベント数</div>
          <div className="py-2.5 px-3 text-right">構成比</div>
          <div className="py-2.5 px-3 text-right">ユニークユーザー</div>
          <div className="py-2.5 px-3 text-right">採用率</div>
          <div className="py-2.5 px-3 text-center">人気度</div>
        </div>
        {/* Rows */}
        {features.map((f) => {
          const isExpanded = expandedCategory === f.categoryKey;
          const pct = totalEvents > 0 ? Math.round((f.eventCount / totalEvents) * 100) : 0;
          return (
            <div key={f.categoryKey}>
              <button
                className="w-full grid grid-cols-[1fr_90px_60px_120px_60px_90px] items-center hover:bg-gray-50 transition-colors text-xs border-b border-gray-50"
                onClick={() => setExpandedCategory(isExpanded ? null : f.categoryKey)}
              >
                <div className="text-left py-2.5 px-3 font-medium text-gray-700 flex items-center gap-2">
                  <span>{CATEGORY_ICONS[f.categoryKey] ?? ''}</span>
                  <span>{f.categoryLabel}</span>
                  <span className={`ml-1 text-gray-400 text-[10px] transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                </div>
                <div className="text-right py-2.5 px-3 tabular-nums text-gray-800 font-medium">
                  {f.eventCount.toLocaleString()}
                </div>
                <div className="text-right py-2.5 px-3 tabular-nums text-gray-500">
                  {pct}%
                </div>
                <div className="text-right py-2.5 px-3 tabular-nums text-gray-600">
                  {f.uniqueUsers}/{f.totalUsers}人
                </div>
                <div className="text-right py-2.5 px-3 tabular-nums text-gray-600">
                  {Math.round(f.adoptionRate * 100)}%
                </div>
                <div className="text-center py-2.5 px-3">
                  <AdoptionStars rate={f.adoptionRate} />
                </div>
              </button>

              {/* Expanded detail rows */}
              {isExpanded && f.topEvents.length > 0 && (
                <div className="bg-gray-50/50 border-b border-gray-100">
                  {f.topEvents.map((evt) => (
                    <div key={evt.eventType} className="flex items-center px-3 py-1.5 text-[11px] text-gray-500">
                      <span className="pl-8 flex-1">{EVENT_TYPE_LABELS[evt.eventType] ?? evt.eventType}</span>
                      <span className="tabular-nums w-20 text-right font-medium text-gray-600">{evt.count.toLocaleString()}</span>
                      <span className="tabular-nums w-24 text-right">{evt.users}人</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Key Findings */}
      {findings.length > 0 && (
        <div className="admin-card px-5 py-4">
          <p className="text-xs font-medium text-gray-500 mb-3">重要な発見</p>
          <div className="space-y-2">
            {findings.map((f, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-lg text-xs ${
                  f.severity === 'high' ? 'bg-red-50 text-red-800'
                    : f.severity === 'medium' ? 'bg-yellow-50 text-yellow-800'
                    : 'bg-blue-50 text-blue-800'
                }`}
              >
                <span className="flex-shrink-0 mt-0.5">
                  {f.severity === 'high' ? '🔴' : f.severity === 'medium' ? '🟡' : '🔵'}
                </span>
                <div>
                  <p className="font-medium">{f.label}</p>
                  <p className="opacity-75 mt-0.5">{f.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
