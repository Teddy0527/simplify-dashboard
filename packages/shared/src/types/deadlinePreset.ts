import type { DeadlineType } from './company';

/** DB row type (snake_case) */
export interface DeadlinePresetRow {
  id: string;
  company_master_id: string;
  recruitment_year: number;
  deadline_type: string;
  label: string;
  deadline_date: string;
  deadline_time: string | null;
  memo: string | null;
  source: string;
  source_url: string | null;
  contributed_by: string | null;
  verified: boolean;
  contributor_count: number;
  created_at: string;
  updated_at: string;
}

/** App type (camelCase) */
export interface DeadlinePreset {
  id: string;
  companyMasterId: string;
  recruitmentYear: number;
  deadlineType: DeadlineType;
  label: string;
  deadlineDate: string;
  deadlineTime?: string;
  memo?: string;
  source: string;
  sourceUrl?: string;
  contributedBy?: string;
  verified: boolean;
  contributorCount: number;
  createdAt: string;
  updatedAt: string;
}

/** search_deadline_presets RPC row type (snake_case) */
export interface DeadlinePresetWithCompanyRow {
  id: string;
  company_master_id: string;
  company_name: string;
  company_industry: string | null;
  company_logo_url: string | null;
  company_website_domain: string | null;
  recruitment_year: number;
  deadline_type: string;
  label: string;
  deadline_date: string;
  deadline_time: string | null;
  memo: string | null;
  source: string;
  source_url: string | null;
  verified: boolean;
  contributor_count: number;
  created_at: string;
  updated_at: string;
}

/** App type with company info */
export interface DeadlinePresetWithCompany extends DeadlinePreset {
  companyName: string;
  companyIndustry?: string;
  companyLogoUrl?: string;
  companyWebsiteDomain?: string;
}

export function toDeadlinePreset(row: DeadlinePresetRow): DeadlinePreset {
  return {
    id: row.id,
    companyMasterId: row.company_master_id,
    recruitmentYear: row.recruitment_year,
    deadlineType: row.deadline_type as DeadlineType,
    label: row.label,
    deadlineDate: row.deadline_date,
    deadlineTime: row.deadline_time ?? undefined,
    memo: row.memo ?? undefined,
    source: row.source,
    sourceUrl: row.source_url ?? undefined,
    contributedBy: row.contributed_by ?? undefined,
    verified: row.verified,
    contributorCount: row.contributor_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toDeadlinePresetWithCompany(row: DeadlinePresetWithCompanyRow): DeadlinePresetWithCompany {
  return {
    id: row.id,
    companyMasterId: row.company_master_id,
    recruitmentYear: row.recruitment_year,
    deadlineType: row.deadline_type as DeadlineType,
    label: row.label,
    deadlineDate: row.deadline_date,
    deadlineTime: row.deadline_time ?? undefined,
    memo: row.memo ?? undefined,
    source: row.source,
    sourceUrl: row.source_url ?? undefined,
    verified: row.verified,
    contributorCount: row.contributor_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    companyName: row.company_name,
    companyIndustry: row.company_industry ?? undefined,
    companyLogoUrl: row.company_logo_url ?? undefined,
    companyWebsiteDomain: row.company_website_domain ?? undefined,
  };
}
