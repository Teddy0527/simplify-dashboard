import { useState } from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useAnalyticsV2 } from '../../hooks/useAnalyticsV2';
import type { V2Tab } from '../../hooks/useAnalyticsV2';
import { OverviewSection } from './analytics/OverviewSection';
import { EngagementSection } from './analytics/EngagementSection';
import { FunnelSection, CohortSection } from './analytics/FunnelSection';
import { FeatureAdoptionSection } from './analytics/FeatureSection';
import { UsersSection, UsersSectionV2 } from './analytics/UsersSection';
import { AARRRSection } from './analytics/AARRRSection';
import { GrowthSection } from './analytics/GrowthSection';
import { RetentionSection } from './analytics/RetentionSection';
import { PeriodSelector } from './analytics/shared';

const USE_V2 = true;

function LoadingSpinner() {
  return (
    <div className="text-center py-12 text-gray-500">
      <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin mb-2" />
      <p className="text-sm">読み込み中...</p>
    </div>
  );
}

function AnalyticsTabV2() {
  const [v2Tab, setV2Tab] = useState<V2Tab>('growth');
  const v2 = useAnalyticsV2(v2Tab);

  return (
    <div className="space-y-6">
      {/* 3-tab pills */}
      <div className="flex items-center justify-between">
        <div className="bg-gray-100 rounded-xl p-1 inline-flex gap-1">
          {([['growth', 'グロース'], ['retention', 'リテンション'], ['users', 'ユーザー詳細']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setV2Tab(key)}
              className={v2Tab === key ? 'admin-pill-tab-active' : 'admin-pill-tab'}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {v2Tab !== 'users' && <PeriodSelector days={v2.days} onChange={v2.setDays} />}
          {v2.isRefreshing && <span className="text-xs text-gray-400">更新中...</span>}
        </div>
      </div>

      {v2.loading ? <LoadingSpinner /> : (
        <>
          {v2Tab === 'growth' && <GrowthSection aarrr={v2.aarrr} ga4={v2.ga4} extensionMetrics={v2.extensionMetrics} />}
          {v2Tab === 'retention' && <RetentionSection retentionTrend={v2.retentionTrend} cohorts={v2.cohorts} />}
          {v2Tab === 'users' && <UsersSectionV2 users={v2.users} getUserBreakdown={v2.getUserBreakdown} />}
        </>
      )}
    </div>
  );
}

function AnalyticsTabV1() {
  const {
    users, trends, engagement, cohorts, funnel, featureAdoption, aarrr, ga4,
    initialLoading, isRefreshing, fetchedAt, getUserBreakdown,
  } = useAnalytics();
  const [activeSection, setActiveSection] = useState<'aarrr' | 'overview' | 'engagement' | 'funnel' | 'features' | 'users'>('aarrr');

  if (initialLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Pill sub-tabs */}
      <div className="flex items-center justify-between">
        <div className="bg-gray-100 rounded-xl p-1 inline-flex gap-1 overflow-x-auto">
          {([
            ['aarrr', 'AARRR'],
            ['overview', '概要'],
            ['engagement', 'エンゲージメント'],
            ['funnel', 'ファネル'],
            ['features', '機能採用'],
            ['users', 'ユーザー一覧'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={
                activeSection === key
                  ? 'admin-pill-tab-active'
                  : 'admin-pill-tab'
              }
            >
              {label}
            </button>
          ))}
        </div>
        {isRefreshing && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-3 flex-shrink-0">
            <div className="w-3 h-3 border border-gray-300 border-t-primary-500 rounded-full animate-spin" />
            更新中
          </div>
        )}
      </div>

      {activeSection === 'aarrr' && (
        <AARRRSection aarrr={aarrr} ga4={ga4} />
      )}

      {activeSection === 'overview' && (
        <OverviewSection
          users={users}
          trends={trends}
          engagement={engagement}
          funnel={funnel}
          fetchedAt={fetchedAt}
        />
      )}

      {activeSection === 'engagement' && (
        <EngagementSection engagement={engagement} />
      )}

      {activeSection === 'funnel' && (
        <>
          <FunnelSection funnel={funnel} />
          <CohortSection cohorts={cohorts} />
        </>
      )}

      {activeSection === 'features' && (
        <FeatureAdoptionSection features={featureAdoption} />
      )}

      {activeSection === 'users' && (
        <UsersSection users={users} getUserBreakdown={getUserBreakdown} />
      )}
    </div>
  );
}

export default function AnalyticsTab() {
  return USE_V2 ? <AnalyticsTabV2 /> : <AnalyticsTabV1 />;
}
