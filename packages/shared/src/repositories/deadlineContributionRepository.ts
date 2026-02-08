import { getSupabase, getCurrentUser } from '../lib/supabase';
import { normalizeLabelKey } from '../utils/labelNormalizer';
import type { DeadlineContribution, DeadlineContributionRow } from '../types/deadlineContribution';
import { toDeadlineContribution } from '../types/deadlineContribution';

/**
 * Submit a deadline signal (fire-and-forget compatible).
 * Skips silently if user account is less than 7 days old (Sybil protection).
 */
export async function contributeDeadlineSignal(
  companyMasterId: string,
  recruitmentYear: number,
  deadlineType: string,
  label: string,
  date: string,
  time?: string,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  // Sybil protection: skip if account < 7 days old
  const accountAge = (Date.now() - new Date(user.created_at).getTime()) / 86400000;
  if (accountAge < 7) return;

  const labelKey = normalizeLabelKey(label);

  const { error } = await getSupabase()
    .from('deadline_contributions')
    .upsert(
      {
        company_master_id: companyMasterId,
        user_id: user.id,
        recruitment_year: recruitmentYear,
        deadline_type: deadlineType,
        label,
        label_key: labelKey,
        reported_date: date,
        reported_time: time ?? null,
        status: 'pending',
      },
      { onConflict: 'company_master_id,user_id,recruitment_year,deadline_type,label_key' }
    );

  if (error) {
    throw new Error(`Failed to contribute deadline signal: ${error.message}`);
  }
}

/**
 * Get the current user's own contributions.
 */
export async function getMyContributions(): Promise<DeadlineContribution[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await getSupabase()
    .from('deadline_contributions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get contributions:', error.message);
    return [];
  }

  return ((data as DeadlineContributionRow[]) ?? []).map(toDeadlineContribution);
}
