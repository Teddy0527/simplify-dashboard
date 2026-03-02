/** RPC row from get_user_analytics_summary */
export interface UserAnalyticsSummaryRow {
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_active_at: string | null;
  company_count: number;
  es_count: number;
  template_count: number;
  total_events: number;
  profile_completion: number;
}

/** App type */
export interface UserAnalyticsSummary {
  userId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt: string;
  lastActiveAt?: string;
  companyCount: number;
  esCount: number;
  templateCount: number;
  totalEvents: number;
  profileCompletion: number;
}

export function toUserAnalyticsSummary(row: UserAnalyticsSummaryRow): UserAnalyticsSummary {
  return {
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    createdAt: row.created_at,
    lastActiveAt: row.last_active_at ?? undefined,
    companyCount: row.company_count,
    esCount: row.es_count,
    templateCount: row.template_count,
    totalEvents: row.total_events,
    profileCompletion: row.profile_completion,
  };
}

/** RPC row from get_user_event_breakdown */
export interface UserEventBreakdownRow {
  event_type: string;
  event_category: string;
  event_count: number;
  last_at: string;
}

/** App type */
export interface UserEventBreakdown {
  eventType: string;
  eventCategory: string;
  eventCount: number;
  lastAt: string;
}

export function toUserEventBreakdown(row: UserEventBreakdownRow): UserEventBreakdown {
  return {
    eventType: row.event_type,
    eventCategory: row.event_category,
    eventCount: row.event_count,
    lastAt: row.last_at,
  };
}

/** RPC row from get_aggregate_trends */
export interface AggregateTrendRow {
  day: string;
  event_category: string;
  event_count: number;
  unique_users: number;
}

/** App type */
export interface AggregateTrend {
  day: string;
  eventCategory: string;
  eventCount: number;
  uniqueUsers: number;
}

export function toAggregateTrend(row: AggregateTrendRow): AggregateTrend {
  return {
    day: row.day,
    eventCategory: row.event_category,
    eventCount: row.event_count,
    uniqueUsers: row.unique_users,
  };
}

// ── Engagement Metrics ──────────────────────────────────────────────────

export interface EngagementMetricsRow {
  day: string;
  dau: number;
  wau: number;
  mau: number;
}

export interface EngagementMetrics {
  day: string;
  dau: number;
  wau: number;
  mau: number;
}

export function toEngagementMetrics(row: EngagementMetricsRow): EngagementMetrics {
  return { day: row.day, dau: row.dau, wau: row.wau, mau: row.mau };
}

// ── Retention Cohorts ───────────────────────────────────────────────────

export interface RetentionCohortRow {
  cohort_week: string;
  week_number: number;
  cohort_size: number;
  retained_users: number;
  retention_rate: number;
}

export interface RetentionCohort {
  cohortWeek: string;
  weekNumber: number;
  cohortSize: number;
  retainedUsers: number;
  retentionRate: number;
}

export function toRetentionCohort(row: RetentionCohortRow): RetentionCohort {
  return {
    cohortWeek: row.cohort_week,
    weekNumber: row.week_number,
    cohortSize: row.cohort_size,
    retainedUsers: row.retained_users,
    retentionRate: row.retention_rate,
  };
}

// ── Activation Funnel ───────────────────────────────────────────────────

export interface ActivationFunnelRow {
  step_name: string;
  step_order: number;
  reached_count: number;
  reach_rate: number;
  median_days_to_reach: number | null;
}

export interface ActivationFunnelStep {
  stepName: string;
  stepOrder: number;
  reachedCount: number;
  reachRate: number;
  medianDaysToReach: number | null;
}

export function toActivationFunnelStep(row: ActivationFunnelRow): ActivationFunnelStep {
  return {
    stepName: row.step_name,
    stepOrder: row.step_order,
    reachedCount: row.reached_count,
    reachRate: row.reach_rate,
    medianDaysToReach: row.median_days_to_reach,
  };
}

// ── Feature Adoption ────────────────────────────────────────────────────

export interface FeatureAdoptionRow {
  feature_name: string;
  adopted_users: number;
  total_users: number;
  adoption_rate: number;
  avg_usage_count: number;
}

export interface FeatureAdoption {
  featureName: string;
  adoptedUsers: number;
  totalUsers: number;
  adoptionRate: number;
  avgUsageCount: number;
}

export function toFeatureAdoption(row: FeatureAdoptionRow): FeatureAdoption {
  return {
    featureName: row.feature_name,
    adoptedUsers: row.adopted_users,
    totalUsers: row.total_users,
    adoptionRate: row.adoption_rate,
    avgUsageCount: row.avg_usage_count,
  };
}

// ── Churn Risk ──────────────────────────────────────────────────────────

export interface ChurnRiskUserRow {
  user_id: string;
  email: string;
  full_name: string | null;
  last_active_at: string;
  days_inactive: number;
  risk_level: string;
  risk_signals: string[];
}

export interface ChurnRiskUser {
  userId: string;
  email: string;
  fullName?: string;
  lastActiveAt: string;
  daysInactive: number;
  riskLevel: 'high' | 'medium' | 'low';
  riskSignals: string[];
}

export function toChurnRiskUser(row: ChurnRiskUserRow): ChurnRiskUser {
  return {
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name ?? undefined,
    lastActiveAt: row.last_active_at,
    daysInactive: row.days_inactive,
    riskLevel: row.risk_level as 'high' | 'medium' | 'low',
    riskSignals: row.risk_signals ?? [],
  };
}

// ── Retention Trend ─────────────────────────────────────────────────
export interface RetentionTrendRow {
  cohort_week: string;
  cohort_size: number;
  d1_rate: number;
  d3_rate: number;
  d7_rate: number;
  is_d1_mature: boolean;
  is_d3_mature: boolean;
  is_d7_mature: boolean;
}

export interface RetentionTrendPoint {
  cohortWeek: string;
  cohortSize: number;
  d1Rate: number;
  d3Rate: number;
  d7Rate: number;
  isD1Mature: boolean;
  isD3Mature: boolean;
  isD7Mature: boolean;
}

export function toRetentionTrendPoint(row: RetentionTrendRow): RetentionTrendPoint {
  return {
    cohortWeek: row.cohort_week,
    cohortSize: row.cohort_size,
    d1Rate: row.d1_rate,
    d3Rate: row.d3_rate,
    d7Rate: row.d7_rate,
    isD1Mature: row.is_d1_mature,
    isD3Mature: row.is_d3_mature,
    isD7Mature: row.is_d7_mature,
  };
}

// ── User Activity Summary (V2) ─────────────────────────────────────
export interface UserActivitySummaryRow {
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_active_at: string | null;
  company_count: number;
  es_count: number;
  template_count: number;
  total_events: number;
  profile_completion: number;
  active_days: number;
  days_since_signup: number;
  return_rate: number;
  last_7d_events: number;
}

export interface UserActivitySummary {
  userId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt: string;
  lastActiveAt?: string;
  companyCount: number;
  esCount: number;
  templateCount: number;
  totalEvents: number;
  profileCompletion: number;
  activeDays: number;
  daysSinceSignup: number;
  returnRate: number;
  last7dEvents: number;
}

export function toUserActivitySummary(row: UserActivitySummaryRow): UserActivitySummary {
  return {
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    createdAt: row.created_at,
    lastActiveAt: row.last_active_at ?? undefined,
    companyCount: row.company_count,
    esCount: row.es_count,
    templateCount: row.template_count,
    totalEvents: row.total_events,
    profileCompletion: row.profile_completion,
    activeDays: row.active_days,
    daysSinceSignup: row.days_since_signup,
    returnRate: row.return_rate,
    last7dEvents: row.last_7d_events,
  };
}

// ── User Login History ──────────────────────────────────────────────

export interface UserLoginHistoryRow {
  event_id: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export interface UserLoginHistory {
  eventId: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

export function toUserLoginHistory(row: UserLoginHistoryRow): UserLoginHistory {
  return {
    eventId: row.event_id,
    createdAt: row.created_at,
    metadata: row.metadata,
  };
}

// ── User Company Detail ─────────────────────────────────────────────

export interface UserCompanyDetailRow {
  company_id: string;
  company_name: string;
  industry: string | null;
  logo_url: string | null;
  website_domain: string | null;
  status: string | null;
  stages: unknown;
  deadlines: unknown;
  application_created_at: string;
  application_updated_at: string | null;
}

export interface UserCompanyDetail {
  companyId: string;
  companyName: string;
  industry?: string;
  logoUrl?: string;
  websiteDomain?: string;
  status?: string;
  stages: unknown;
  deadlines: unknown;
  applicationCreatedAt: string;
  applicationUpdatedAt?: string;
}

export function toUserCompanyDetail(row: UserCompanyDetailRow): UserCompanyDetail {
  return {
    companyId: row.company_id,
    companyName: row.company_name,
    industry: row.industry ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    websiteDomain: row.website_domain ?? undefined,
    status: row.status ?? undefined,
    stages: row.stages,
    deadlines: row.deadlines,
    applicationCreatedAt: row.application_created_at,
    applicationUpdatedAt: row.application_updated_at ?? undefined,
  };
}

// ── Extension Daily Metrics ─────────────────────────────────────────
export interface ExtensionDailyMetricsRow {
  date: string;
  total_users: number;
  new_users: number;
  sessions: number;
}

export interface ExtensionDailyMetrics {
  date: string;
  totalUsers: number;
  newUsers: number;
  sessions: number;
}

export function toExtensionDailyMetrics(row: ExtensionDailyMetricsRow): ExtensionDailyMetrics {
  return {
    date: row.date,
    totalUsers: row.total_users,
    newUsers: row.new_users,
    sessions: row.sessions,
  };
}

// ── Feature Popularity ──────────────────────────────────────────────

export interface FeaturePopularityRow {
  category_key: string;
  category_label: string;
  event_count: number;
  unique_users: number;
  total_users: number;
  adoption_rate: number;
  top_events: Array<{ event_type: string; count: number; users: number }>;
}

export interface FeaturePopularity {
  categoryKey: string;
  categoryLabel: string;
  eventCount: number;
  uniqueUsers: number;
  totalUsers: number;
  adoptionRate: number;
  topEvents: Array<{ eventType: string; count: number; users: number }>;
}

export function toFeaturePopularity(row: FeaturePopularityRow): FeaturePopularity {
  return {
    categoryKey: row.category_key,
    categoryLabel: row.category_label,
    eventCount: row.event_count,
    uniqueUsers: row.unique_users,
    totalUsers: row.total_users,
    adoptionRate: row.adoption_rate,
    topEvents: (row.top_events ?? []).map((e) => ({
      eventType: e.event_type,
      count: e.count,
      users: e.users,
    })),
  };
}

// ── Registered Company Ranking ───────────────────────────────────────

export interface RegisteredCompanyRankingRow {
  company_name: string;
  industry: string | null;
  website_domain: string | null;
  user_count: number;
}

export interface RegisteredCompanyRanking {
  companyName: string;
  industry?: string;
  websiteDomain?: string;
  userCount: number;
}

export function toRegisteredCompanyRanking(row: RegisteredCompanyRankingRow): RegisteredCompanyRanking {
  return {
    companyName: row.company_name,
    industry: row.industry ?? undefined,
    websiteDomain: row.website_domain ?? undefined,
    userCount: row.user_count,
  };
}

// ── GA4 Metrics ──────────────────────────────────────────────────────

export interface GA4MetricsRow {
  date: string;        // YYYYMMDD
  totalUsers: number;
  newUsers: number;
  sessions: number;
}

export interface GA4MetricsResponse {
  rows: GA4MetricsRow[];
  configured: boolean;
  cwsRows: GA4MetricsRow[];
  cwsConfigured: boolean;
  error?: string;
}

// ── User Daily Activity ─────────────────────────────────────────────

export interface UserDailyActivityRow {
  activity_date: string;
  login_count: number;
  event_count: number;
}

export interface UserDailyActivity {
  activityDate: string;
  loginCount: number;
  eventCount: number;
}

export function toUserDailyActivity(row: UserDailyActivityRow): UserDailyActivity {
  return {
    activityDate: row.activity_date,
    loginCount: row.login_count,
    eventCount: row.event_count,
  };
}

// ── AARRR Metrics ─────────────────────────────────────────────────────

export interface AARRRMetricsRow {
  metric_type: string;
  period_label: string;
  user_count: number;
  total_count: number | null;
  rate: number | null;
}

export interface ActivationDataPoint {
  date: string;
  signupCount: number;
}

export interface RetentionDayRate {
  dayMark: string;       // 'D1' | 'D3' | 'D7'
  retainedUsers: number;
  cohortSize: number;
  rate: number;          // 0.0–1.0
}

export interface AARRRData {
  activation: ActivationDataPoint[];
  retention: RetentionDayRate[];
}

// ── Autofill Daily Metrics ───────────────────────────────────────────

export interface AutofillDailyMetricsRow {
  date: string;
  total_runs: number;
  success: number;
  errors: number;
  unique_users: number;
  filled_fields: number;
}

export interface AutofillDailyMetrics {
  date: string;
  totalRuns: number;
  success: number;
  errors: number;
  uniqueUsers: number;
  filledFields: number;
}

export function toAutofillDailyMetrics(row: AutofillDailyMetricsRow): AutofillDailyMetrics {
  return {
    date: row.date,
    totalRuns: row.total_runs,
    success: row.success,
    errors: row.errors,
    uniqueUsers: row.unique_users,
    filledFields: row.filled_fields,
  };
}

// ── Autofill Site Ranking ───────────────────────────────────────────

export interface AutofillSiteRankingRow {
  domain: string;
  total_runs: number;
  unique_users: number;
  filled_fields: number;
  top_urls: string[];
}

export interface AutofillSiteRanking {
  domain: string;
  totalRuns: number;
  uniqueUsers: number;
  filledFields: number;
  topUrls: string[];
}

export function toAutofillSiteRanking(row: AutofillSiteRankingRow): AutofillSiteRanking {
  return {
    domain: row.domain,
    totalRuns: row.total_runs,
    uniqueUsers: row.unique_users,
    filledFields: row.filled_fields,
    topUrls: row.top_urls ?? [],
  };
}

export function toAARRRData(rows: AARRRMetricsRow[]): AARRRData {
  const activation: ActivationDataPoint[] = [];
  const retention: RetentionDayRate[] = [];
  for (const row of rows) {
    if (row.metric_type === 'activation') {
      activation.push({ date: row.period_label, signupCount: row.user_count });
    } else if (row.metric_type === 'retention') {
      retention.push({
        dayMark: row.period_label,
        retainedUsers: row.user_count,
        cohortSize: row.total_count ?? 0,
        rate: row.rate ?? 0,
      });
    }
  }
  activation.sort((a, b) => a.date.localeCompare(b.date));
  return { activation, retention };
}
