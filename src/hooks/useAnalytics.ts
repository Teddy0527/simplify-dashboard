import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getUserAnalyticsSummary,
  getUserEventBreakdown,
  getAggregateTrends,
  getEngagementMetrics,
  getRetentionCohorts,
  getActivationFunnel,
  getFeatureAdoption,
  getAARRRMetrics,
  getGA4Metrics,
} from '@jobsimplify/shared';
import type {
  UserAnalyticsSummary,
  AggregateTrend,
  UserEventBreakdown,
  EngagementMetrics,
  RetentionCohort,
  ActivationFunnelStep,
  FeatureAdoption,
  AARRRData,
  GA4MetricsResponse,
} from '@jobsimplify/shared';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useAnalytics() {
  const [users, setUsers] = useState<UserAnalyticsSummary[]>([]);
  const [trends, setTrends] = useState<AggregateTrend[]>([]);
  const [engagement, setEngagement] = useState<EngagementMetrics[]>([]);
  const [cohorts, setCohorts] = useState<RetentionCohort[]>([]);
  const [funnel, setFunnel] = useState<ActivationFunnelStep[]>([]);
  const [featureAdoption, setFeatureAdoption] = useState<FeatureAdoption[]>([]);
  const [aarrr, setAarrr] = useState<AARRRData>({ activation: [], retention: [] });
  const [ga4, setGa4] = useState<GA4MetricsResponse>({ rows: [], configured: false, cwsRows: [], cwsConfigured: false });
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const hasLoadedOnce = useRef(false);

  const refresh = useCallback(async () => {
    const isInitial = !hasLoadedOnce.current;
    if (isInitial) {
      setInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const [usersData, trendsData, engData, cohortsData, funnelData, adoptionData, aarrrData, ga4Data] = await Promise.all([
        getUserAnalyticsSummary(),
        getAggregateTrends(14),
        getEngagementMetrics(30),
        getRetentionCohorts(8),
        getActivationFunnel(90),
        getFeatureAdoption(),
        getAARRRMetrics(30),
        getGA4Metrics(30),
      ]);
      setUsers(usersData);
      setTrends(trendsData);
      setEngagement(engData);
      setCohorts(cohortsData);
      setFunnel(funnelData);
      setFeatureAdoption(adoptionData);
      setAarrr(aarrrData);
      setGa4(ga4Data);
      setFetchedAt(new Date());
      hasLoadedOnce.current = true;
    } catch (err) {
      console.error('Analytics refresh failed:', err);
      // On initial load failure, set empty arrays; on refresh failure, keep existing data
      if (isInitial) {
        setUsers([]);
        setTrends([]);
        setEngagement([]);
        setCohorts([]);
        setFunnel([]);
        setFeatureAdoption([]);
        setAarrr({ activation: [], retention: [] });
        setGa4({ rows: [], configured: false, cwsRows: [], cwsConfigured: false });
        hasLoadedOnce.current = true;
      }
    } finally {
      setInitialLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => { refresh(); }, [refresh]);

  // Auto-refresh every 5 minutes when tab is visible
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startInterval = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          refresh();
        }
      }, REFRESH_INTERVAL_MS);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh immediately when tab becomes visible (if it's been hidden)
        refresh();
        startInterval();
      } else if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    startInterval();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refresh]);

  const getUserBreakdown = useCallback(async (userId: string): Promise<UserEventBreakdown[]> => {
    try {
      return await getUserEventBreakdown(userId);
    } catch {
      return [];
    }
  }, []);

  return {
    users, trends, engagement, cohorts, funnel, featureAdoption, aarrr, ga4,
    initialLoading, isRefreshing, fetchedAt, refresh, getUserBreakdown,
  };
}
