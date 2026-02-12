import { useState, useEffect, useCallback } from 'react';
import {
  getUserAnalyticsSummary,
  getUserEventBreakdown,
  getAggregateTrends,
} from '@jobsimplify/shared';
import type {
  UserAnalyticsSummary,
  AggregateTrend,
  UserEventBreakdown,
} from '@jobsimplify/shared';

export function useAnalytics() {
  const [users, setUsers] = useState<UserAnalyticsSummary[]>([]);
  const [trends, setTrends] = useState<AggregateTrend[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, trendsData] = await Promise.all([
        getUserAnalyticsSummary(),
        getAggregateTrends(14),
      ]);
      setUsers(usersData);
      setTrends(trendsData);
    } catch {
      setUsers([]);
      setTrends([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const getUserBreakdown = useCallback(async (userId: string): Promise<UserEventBreakdown[]> => {
    try {
      return await getUserEventBreakdown(userId);
    } catch {
      return [];
    }
  }, []);

  return { users, trends, loading, refresh, getUserBreakdown };
}
