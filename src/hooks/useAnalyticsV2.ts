import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAARRRMetrics, getGA4Metrics, getExtensionDailyMetrics,
  getRetentionTrend, getRetentionCohorts,
  getUserActivitySummary, getUserEventBreakdown,
  getFeaturePopularity,
} from '@jobsimplify/shared';
import type {
  AARRRData, GA4MetricsResponse, ExtensionDailyMetrics,
  RetentionTrendPoint, RetentionCohort,
  UserActivitySummary, UserEventBreakdown,
  FeaturePopularity,
} from '@jobsimplify/shared';

export type V2Tab = 'growth' | 'retention' | 'features' | 'users';

/** Add a cumulative field to each item in the array. */
export function withCumulative<T>(data: T[], getValue: (d: T) => number): (T & { cumulative: number })[] {
  let sum = 0;
  return data.map((d) => {
    sum += getValue(d);
    return { ...d, cumulative: sum };
  });
}

/** Normalize GA4 date YYYYMMDD to YYYY-MM-DD. */
export function normalizeGA4Date(yyyymmdd: string): string {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

export function useAnalyticsV2(activeTab: V2Tab) {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);

  // Growth state
  const [aarrr, setAarrr] = useState<AARRRData>({ activation: [], retention: [] });
  const [ga4, setGa4] = useState<GA4MetricsResponse>({ rows: [], configured: false, cwsRows: [], cwsConfigured: false });
  const [extensionMetrics, setExtensionMetrics] = useState<ExtensionDailyMetrics[]>([]);

  // Retention state
  const [retentionTrend, setRetentionTrend] = useState<RetentionTrendPoint[]>([]);
  const [cohorts, setCohorts] = useState<RetentionCohort[]>([]);

  // Features state
  const [featurePopularity, setFeaturePopularity] = useState<FeaturePopularity[]>([]);

  // Users state
  const [users, setUsers] = useState<UserActivitySummary[]>([]);

  const fetchGrowth = useCallback(async (d: number) => {
    const [aarrrData, ga4Data, extData] = await Promise.all([
      getAARRRMetrics(d),
      getGA4Metrics(d),
      getExtensionDailyMetrics(d),
    ]);
    setAarrr(aarrrData);
    setGa4(ga4Data);
    setExtensionMetrics(extData);
  }, []);

  const fetchRetention = useCallback(async () => {
    const weeks = days <= 30 ? 8 : days <= 60 ? 12 : 16;
    const [trendData, cohortData] = await Promise.all([
      getRetentionTrend(weeks),
      getRetentionCohorts(weeks),
    ]);
    setRetentionTrend(trendData);
    setCohorts(cohortData);
  }, [days]);

  const fetchFeatures = useCallback(async (d: number) => {
    const data = await getFeaturePopularity(d);
    setFeaturePopularity(data);
  }, []);

  const fetchUsers = useCallback(async () => {
    const data = await getUserActivitySummary();
    setUsers(data);
  }, []);

  const refresh = useCallback(async () => {
    const isInitial = !hasLoadedOnce.current;
    if (isInitial) setLoading(true);
    else setIsRefreshing(true);

    try {
      switch (activeTab) {
        case 'growth': await fetchGrowth(days); break;
        case 'retention': await fetchRetention(); break;
        case 'features': await fetchFeatures(days); break;
        case 'users': await fetchUsers(); break;
      }
      hasLoadedOnce.current = true;
    } catch (err) {
      console.error('Analytics V2 refresh failed:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, days, fetchGrowth, fetchRetention, fetchFeatures, fetchUsers]);

  // Fetch on tab/days change
  useEffect(() => {
    refresh();
  }, [refresh]);

  const getUserBreakdown = useCallback(async (userId: string): Promise<UserEventBreakdown[]> => {
    try {
      return await getUserEventBreakdown(userId);
    } catch {
      return [];
    }
  }, []);

  return {
    // Common
    activeTab, days, setDays, loading, isRefreshing, refresh,
    // Growth
    aarrr, ga4, extensionMetrics,
    // Retention
    retentionTrend, cohorts,
    // Features
    featurePopularity,
    // Users
    users, getUserBreakdown,
  };
}
