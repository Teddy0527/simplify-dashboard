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
