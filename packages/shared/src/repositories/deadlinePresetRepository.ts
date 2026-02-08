import { getSupabase } from '../lib/supabase';
import type { DeadlinePreset, DeadlinePresetWithCompany, DeadlinePresetRow, DeadlinePresetWithCompanyRow } from '../types/deadlinePreset';
import { toDeadlinePreset, toDeadlinePresetWithCompany } from '../types/deadlinePreset';

export async function getPresetsByMasterId(
  companyMasterId: string,
  year?: number,
): Promise<DeadlinePreset[]> {
  const { data, error } = await getSupabase().rpc('get_deadline_presets_by_master_id', {
    master_id: companyMasterId,
    target_year: year ?? null,
  });

  if (error) {
    console.error('Failed to get deadline presets:', error.message);
    return [];
  }

  return ((data as DeadlinePresetRow[]) ?? []).map(toDeadlinePreset);
}

export async function searchDeadlinePresets(
  query: string,
  year: number,
  limit: number = 50,
  offset: number = 0,
): Promise<DeadlinePresetWithCompany[]> {
  const { data, error } = await getSupabase().rpc('search_deadline_presets', {
    search_query: query,
    target_year: year,
    result_limit: limit,
    result_offset: offset,
  });

  if (error) {
    console.error('Failed to search deadline presets:', error.message);
    return [];
  }

  return ((data as DeadlinePresetWithCompanyRow[]) ?? []).map(toDeadlinePresetWithCompany);
}
