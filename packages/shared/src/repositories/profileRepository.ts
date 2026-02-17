import { getSupabase, isAuthenticated, getCurrentUser } from '../lib/supabase';
import { getProfile as getLocalProfile, saveProfile as saveLocalProfile } from '../storage/chromeStorage';
import type { Profile } from '../types/profile';
import { DEFAULT_PROFILE } from '../types/profile';
import { trackEventAsync } from './eventRepository';
import { trackMilestoneOnce } from '../utils/milestoneTracker';

export async function getProfile(): Promise<Profile> {
  if (!(await isAuthenticated())) {
    return getLocalProfile();
  }

  const user = await getCurrentUser();
  if (!user) return getLocalProfile();

  const { data, error } = await getSupabase()
    .from('user_profiles')
    .select('profile_data')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return DEFAULT_PROFILE;
  }

  return data.profile_data as Profile;
}

export async function saveProfile(profile: Profile): Promise<void> {
  if (!(await isAuthenticated())) {
    return saveLocalProfile(profile);
  }

  const user = await getCurrentUser();
  if (!user) return saveLocalProfile(profile);

  const { error } = await getSupabase()
    .from('user_profiles')
    .upsert(
      { user_id: user.id, profile_data: profile as any },
      { onConflict: 'user_id' },
    );

  if (error) {
    throw new Error(`Failed to save profile: ${error.message}`);
  }

  trackEventAsync('profile.update');
  trackMilestoneOnce('milestone.first_profile_update');
}
