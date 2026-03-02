import { getSupabase } from '../lib/supabase';
import type {
  UserAnalyticsSummary, UserAnalyticsSummaryRow,
  UserEventBreakdown, UserEventBreakdownRow,
  AggregateTrend, AggregateTrendRow,
  EngagementMetrics, EngagementMetricsRow,
  RetentionCohort, RetentionCohortRow,
  ActivationFunnelStep, ActivationFunnelRow,
  FeatureAdoption, FeatureAdoptionRow,
  FeaturePopularity, FeaturePopularityRow,
  ChurnRiskUser, ChurnRiskUserRow,
  AARRRMetricsRow,
  GA4MetricsResponse,
  RetentionTrendPoint, RetentionTrendRow,
  UserActivitySummary, UserActivitySummaryRow,
  ExtensionDailyMetrics, ExtensionDailyMetricsRow,
  UserLoginHistory, UserLoginHistoryRow,
  UserCompanyDetail, UserCompanyDetailRow,
  RegisteredCompanyRanking, RegisteredCompanyRankingRow,
  UserDailyActivity, UserDailyActivityRow,
  AutofillDailyMetrics, AutofillDailyMetricsRow,
  AutofillSiteRanking, AutofillSiteRankingRow,
} from '../types/analyticsTypes';
import {
  toUserAnalyticsSummary,
  toUserEventBreakdown,
  toAggregateTrend,
  toEngagementMetrics,
  toRetentionCohort,
  toActivationFunnelStep,
  toFeatureAdoption,
  toFeaturePopularity,
  toChurnRiskUser,
  toAARRRData,
  toRetentionTrendPoint,
  toUserActivitySummary,
  toExtensionDailyMetrics,
  toUserLoginHistory,
  toUserCompanyDetail,
  toRegisteredCompanyRanking,
  toUserDailyActivity,
  toAutofillDailyMetrics,
  toAutofillSiteRanking,
} from '../types/analyticsTypes';

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

/**
 * Get engagement metrics (DAU/WAU/MAU) time series.
 */
export async function getEngagementMetrics(days: number = 30): Promise<EngagementMetrics[]> {
  const { data, error } = await getSupabase()
    .rpc('get_engagement_metrics', { p_days: days });

  if (error) {
    console.error('Failed to get engagement metrics:', error.message);
    return [];
  }

  return ((data as EngagementMetricsRow[]) ?? []).map(toEngagementMetrics);
}

/**
 * Get retention cohort matrix.
 */
export async function getRetentionCohorts(weeks: number = 8): Promise<RetentionCohort[]> {
  const { data, error } = await getSupabase()
    .rpc('get_retention_cohorts', { p_weeks: weeks });

  if (error) {
    console.error('Failed to get retention cohorts:', error.message);
    return [];
  }

  return ((data as RetentionCohortRow[]) ?? []).map(toRetentionCohort);
}

/**
 * Get activation funnel step data.
 */
export async function getActivationFunnel(days: number = 30): Promise<ActivationFunnelStep[]> {
  const { data, error } = await getSupabase()
    .rpc('get_activation_funnel', { p_days: days });

  if (error) {
    console.error('Failed to get activation funnel:', error.message);
    return [];
  }

  return ((data as ActivationFunnelRow[]) ?? []).map(toActivationFunnelStep);
}

/**
 * Get feature adoption rates.
 */
export async function getFeatureAdoption(): Promise<FeatureAdoption[]> {
  const { data, error } = await getSupabase()
    .rpc('get_feature_adoption');

  if (error) {
    console.error('Failed to get feature adoption:', error.message);
    return [];
  }

  return ((data as FeatureAdoptionRow[]) ?? []).map(toFeatureAdoption);
}

/**
 * Get feature popularity by category (5 functional groups).
 */
export async function getFeaturePopularity(days: number = 90): Promise<FeaturePopularity[]> {
  const { data, error } = await getSupabase()
    .rpc('get_feature_popularity', { p_days: days });

  if (error) {
    console.error('Failed to get feature popularity:', error.message);
    return [];
  }

  return ((data as FeaturePopularityRow[]) ?? []).map(toFeaturePopularity);
}

/**
 * Get users at risk of churning.
 */
export async function getChurnRiskUsers(): Promise<ChurnRiskUser[]> {
  const { data, error } = await getSupabase()
    .rpc('get_churn_risk_users');

  if (error) {
    console.error('Failed to get churn risk users:', error.message);
    return [];
  }

  return ((data as ChurnRiskUserRow[]) ?? []).map(toChurnRiskUser);
}

/**
 * Get GA4 metrics via Edge Function.
 */
export async function getGA4Metrics(days: number = 30): Promise<GA4MetricsResponse> {
  const empty: GA4MetricsResponse = { rows: [], configured: false, cwsRows: [], cwsConfigured: false };
  try {
    const { data, error } = await getSupabase()
      .functions.invoke('ga4-metrics', { body: { days } });
    if (error) {
      return { ...empty, error: error.message };
    }
    return { ...empty, ...(data as GA4MetricsResponse) };
  } catch (err) {
    return { ...empty, error: String(err) };
  }
}

/**
 * Get AARRR pirate metrics (activation + retention).
 */
export async function getAARRRMetrics(days: number = 30) {
  const { data, error } = await getSupabase()
    .rpc('get_aarrr_metrics', { p_days: days });
  if (error) {
    console.error('Failed to get AARRR metrics:', error.message);
    return { activation: [], retention: [] };
  }
  return toAARRRData((data as AARRRMetricsRow[]) ?? []);
}

/**
 * Get retention trend by weekly cohorts with d1/d3/d7 rates.
 */
export async function getRetentionTrend(weeks: number = 12): Promise<RetentionTrendPoint[]> {
  const { data, error } = await getSupabase()
    .rpc('get_retention_trend', { p_weeks: weeks });
  if (error) {
    console.error('Failed to get retention trend:', error.message);
    return [];
  }
  return ((data as RetentionTrendRow[]) ?? []).map(toRetentionTrendPoint);
}

/**
 * Get extended user activity summary (V2 with active_days, return_rate, etc).
 */
export async function getUserActivitySummary(): Promise<UserActivitySummary[]> {
  const { data, error } = await getSupabase()
    .rpc('get_user_activity_summary');
  if (error) {
    console.error('Failed to get user activity summary:', error.message);
    return [];
  }
  return ((data as UserActivitySummaryRow[]) ?? []).map(toUserActivitySummary);
}

/**
 * Get extension daily metrics (DAU, new users, sessions).
 */
export async function getExtensionDailyMetrics(days: number = 30): Promise<ExtensionDailyMetrics[]> {
  const { data, error } = await getSupabase()
    .rpc('get_extension_daily_metrics', { days_param: days });
  if (error) {
    console.error('Failed to get extension daily metrics:', error.message);
    return [];
  }
  return ((data as ExtensionDailyMetricsRow[]) ?? []).map(toExtensionDailyMetrics);
}

/**
 * Get login history for a specific user (admin only).
 */
export async function getUserLoginHistory(userId: string): Promise<UserLoginHistory[]> {
  const { data, error } = await getSupabase()
    .rpc('get_user_login_history', { p_user_id: userId });
  if (error) {
    console.error('Failed to get user login history:', error.message);
    return [];
  }
  return ((data as UserLoginHistoryRow[]) ?? []).map(toUserLoginHistory);
}

/**
 * Get companies registered by a specific user (admin only).
 */
export async function getUserCompanies(userId: string): Promise<UserCompanyDetail[]> {
  const { data, error } = await getSupabase()
    .rpc('get_user_companies', { p_user_id: userId });
  if (error) {
    console.error('Failed to get user companies:', error.message);
    return [];
  }
  return ((data as UserCompanyDetailRow[]) ?? []).map(toUserCompanyDetail);
}

/**
 * Get daily activity for a specific user (admin only).
 */
export async function getUserDailyActivity(userId: string): Promise<UserDailyActivity[]> {
  const { data, error } = await getSupabase()
    .rpc('get_user_daily_activity', { p_user_id: userId });
  if (error) {
    console.error('Failed to get user daily activity:', error.message);
    return [];
  }
  return ((data as UserDailyActivityRow[]) ?? []).map(toUserDailyActivity);
}

/**
 * Get registered company ranking across all users (admin only).
 */
export async function getRegisteredCompanyRanking(): Promise<RegisteredCompanyRanking[]> {
  const { data, error } = await getSupabase()
    .rpc('get_registered_company_ranking');
  if (error) {
    console.error('Failed to get registered company ranking:', error.message);
    return [];
  }
  return ((data as RegisteredCompanyRankingRow[]) ?? []).map(toRegisteredCompanyRanking);
}

/**
 * Get autofill daily metrics (admin only).
 */
export async function getAutofillDailyMetrics(days: number = 30): Promise<AutofillDailyMetrics[]> {
  const { data, error } = await getSupabase()
    .rpc('get_autofill_daily_metrics', { p_days: days });
  if (error) {
    console.error('Failed to get autofill daily metrics:', error.message);
    return [];
  }
  return ((data as AutofillDailyMetricsRow[]) ?? []).map(toAutofillDailyMetrics);
}

/**
 * Get autofill site ranking (admin only).
 */
export async function getAutofillSiteRanking(days: number = 30): Promise<AutofillSiteRanking[]> {
  const { data, error } = await getSupabase()
    .rpc('get_autofill_site_ranking', { p_days: days });
  if (error) {
    console.error('Failed to get autofill site ranking:', error.message);
    return [];
  }
  return ((data as AutofillSiteRankingRow[]) ?? []).map(toAutofillSiteRanking);
}
