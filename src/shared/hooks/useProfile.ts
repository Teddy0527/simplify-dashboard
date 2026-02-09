import { useState, useEffect, useCallback } from 'react';
import { getProfile, saveProfile } from '@entrify/shared';
import type { Profile } from '@entrify/shared';
import { DEFAULT_PROFILE } from '@entrify/shared';
import { useAuth } from './useAuth';

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (updated: Profile) => {
    setError(null);
    try {
      await saveProfile(updated);
      setProfile(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile');
      throw e;
    }
  }, []);

  return { profile, loading, error, save, reload: load };
}
