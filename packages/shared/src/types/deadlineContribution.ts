import type { DeadlineType } from './company';

export type ContributionStatus = 'pending' | 'verified' | 'rejected';

/** DB row type (snake_case) */
export interface DeadlineContributionRow {
  id: string;
  company_master_id: string;
  user_id: string;
  recruitment_year: number;
  deadline_type: string;
  label: string;
  label_key: string;
  reported_date: string;
  reported_time: string | null;
  source_note: string | null;
  status: ContributionStatus;
  created_at: string;
}

/** App type (camelCase) */
export interface DeadlineContribution {
  id: string;
  companyMasterId: string;
  userId: string;
  recruitmentYear: number;
  deadlineType: DeadlineType;
  label: string;
  labelKey: string;
  reportedDate: string;
  reportedTime?: string;
  sourceNote?: string;
  status: ContributionStatus;
  createdAt: string;
}

export function toDeadlineContribution(row: DeadlineContributionRow): DeadlineContribution {
  return {
    id: row.id,
    companyMasterId: row.company_master_id,
    userId: row.user_id,
    recruitmentYear: row.recruitment_year,
    deadlineType: row.deadline_type as DeadlineType,
    label: row.label,
    labelKey: row.label_key,
    reportedDate: row.reported_date,
    reportedTime: row.reported_time ?? undefined,
    sourceNote: row.source_note ?? undefined,
    status: row.status,
    createdAt: row.created_at,
  };
}
