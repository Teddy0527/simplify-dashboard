import { getSupabase, getCurrentUser } from '../lib/supabase';

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
