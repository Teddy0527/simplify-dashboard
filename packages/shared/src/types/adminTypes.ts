/** RPC row from get_pending_contributions_summary */
export interface PendingContributionSummaryRow {
  company_master_id: string;
  company_name: string;
  company_logo_url: string | null;
  recruitment_year: number;
  deadline_type: string;
  label: string;
  label_key: string;
  most_common_date: string;
  contributor_count: number;
  unique_dates_count: number;
  is_divergent: boolean;
  existing_preset_date: string | null;
}

/** App type */
export interface PendingContributionSummary {
  companyMasterId: string;
  companyName: string;
  companyLogoUrl?: string;
  recruitmentYear: number;
  deadlineType: string;
  label: string;
  labelKey: string;
  mostCommonDate: string;
  contributorCount: number;
  uniqueDatesCount: number;
  isDivergent: boolean;
  existingPresetDate?: string;
}

export function toPendingContributionSummary(row: PendingContributionSummaryRow): PendingContributionSummary {
  return {
    companyMasterId: row.company_master_id,
    companyName: row.company_name,
    companyLogoUrl: row.company_logo_url ?? undefined,
    recruitmentYear: row.recruitment_year,
    deadlineType: row.deadline_type,
    label: row.label,
    labelKey: row.label_key,
    mostCommonDate: row.most_common_date,
    contributorCount: row.contributor_count,
    uniqueDatesCount: row.unique_dates_count,
    isDivergent: row.is_divergent,
    existingPresetDate: row.existing_preset_date ?? undefined,
  };
}
