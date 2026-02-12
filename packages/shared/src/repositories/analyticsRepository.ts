import { getSupabase } from '../lib/supabase';
import type { UserAnalyticsSummary, UserAnalyticsSummaryRow } from '../types/analyticsTypes';
import { toUserAnalyticsSummary } from '../types/analyticsTypes';
import type { UserEventBreakdown, UserEventBreakdownRow } from '../types/analyticsTypes';
import { toUserEventBreakdown } from '../types/analyticsTypes';
import type { AggregateTrend, AggregateTrendRow } from '../types/analyticsTypes';
import { toAggregateTrend } from '../types/analyticsTypes';

/**
 * Get user analytics summary (admin only).
 */
export async function getUserAnalyticsSummary(): Promise<UserAnalyticsSummary[]> {
  const { data, error } = await getSupabase()
    .rpc('get_user_analytics_summary');

  if (error) {
    console.error('Failed to get user analytics summary:', error.message);
    return [];
  }

  return ((data as UserAnalyticsSummaryRow[]) ?? []).map(toUserAnalyticsSummary);
}

/**
 * Get event breakdown for a specific user (admin only).
 */
export async function getUserEventBreakdown(userId: string): Promise<UserEventBreakdown[]> {
  const { data, error } = await getSupabase()
    .rpc('get_user_event_breakdown', { p_user_id: userId });

  if (error) {
    console.error('Failed to get user event breakdown:', error.message);
    return [];
  }

  return ((data as UserEventBreakdownRow[]) ?? []).map(toUserEventBreakdown);
}

/**
 * Get aggregate activity trends (admin only).
 */
export async function getAggregateTrends(days: number = 30): Promise<AggregateTrend[]> {
  const { data, error } = await getSupabase()
    .rpc('get_aggregate_trends', { p_days: days });

  if (error) {
    console.error('Failed to get aggregate trends:', error.message);
    return [];
  }

  return ((data as AggregateTrendRow[]) ?? []).map(toAggregateTrend);
}
