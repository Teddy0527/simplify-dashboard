import { getSupabase, getCurrentUser } from '../lib/supabase';
import type { PendingContributionSummary, PendingContributionSummaryRow } from '../types/adminTypes';
import { toPendingContributionSummary } from '../types/adminTypes';

/**
 * Check if the current user is an admin.
 */
export async function checkIsAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const { data, error } = await getSupabase()
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (error || !data) return false;
  return data.is_admin === true;
}

/**
 * Get aggregated pending contribution summaries (admin only).
 */
export async function getPendingContributionsSummary(): Promise<PendingContributionSummary[]> {
  const { data, error } = await getSupabase()
    .rpc('get_pending_contributions_summary');

  if (error) {
    console.error('Failed to get pending contributions summary:', error.message);
    return [];
  }

  return ((data as PendingContributionSummaryRow[]) ?? []).map(toPendingContributionSummary);
}

/**
 * Verify a contribution group and create/update a preset (admin only).
 */
export async function verifyContribution(params: {
  companyMasterId: string;
  recruitmentYear: number;
  deadlineType: string;
  labelKey: string;
  date: string;
  time?: string;
  label?: string;
  memo?: string;
}): Promise<string | null> {
  const { data, error } = await getSupabase()
    .rpc('verify_contribution', {
      p_company_master_id: params.companyMasterId,
      p_recruitment_year: params.recruitmentYear,
      p_deadline_type: params.deadlineType,
      p_label_key: params.labelKey,
      p_date: params.date,
      p_time: params.time ?? null,
      p_label: params.label ?? null,
      p_memo: params.memo ?? null,
    });

  if (error) {
    throw new Error(`Failed to verify contribution: ${error.message}`);
  }

  return data as string | null;
}

/**
 * Reject a contribution group with optional reason (admin only).
 */
export async function rejectContributions(
  companyMasterId: string,
  recruitmentYear: number,
  deadlineType: string,
  labelKey: string,
  reason?: string,
): Promise<void> {
  const { error } = await getSupabase()
    .rpc('reject_contributions', {
      p_company_master_id: companyMasterId,
      p_recruitment_year: recruitmentYear,
      p_deadline_type: deadlineType,
      p_label_key: labelKey,
      p_reason: reason ?? null,
    });

  if (error) {
    throw new Error(`Failed to reject contributions: ${error.message}`);
  }
}

/**
 * Recalculate all contributor counts (admin only).
 */
export async function recalculateContributorCounts(): Promise<void> {
  const { error } = await getSupabase()
    .rpc('recalculate_contributor_counts');

  if (error) {
    throw new Error(`Failed to recalculate contributor counts: ${error.message}`);
  }
}
