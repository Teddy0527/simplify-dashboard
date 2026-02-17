import { useState, useCallback, useEffect } from 'react';
import { JobSite } from '@jobsimplify/shared';
import { useAuth } from '../shared/hooks/useAuth';
import {
  getJobSites as fetchJobSites,
  addJobSite as addJobSiteRepo,
  updateJobSite as updateJobSiteRepo,
  deleteJobSite as deleteJobSiteRepo,
} from '@jobsimplify/shared';

export function useJobSites() {
  const { user } = useAuth();
  const [sites, setSites] = useState<JobSite[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    fetchJobSites()
      .then((data) => {
        setSites(data);
        setLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load job sites:', err);
        setLoaded(true);
      });
  }, [user?.id]);

  const addSite = useCallback(async (site: JobSite): Promise<{ ok: boolean }> => {
    setSites((prev) => [site, ...prev]);
    try {
      await addJobSiteRepo(site);
      return { ok: true };
    } catch {
      setSites((prev) => prev.filter((s) => s.id !== site.id));
      return { ok: false };
    }
  }, []);

  const updateSite = useCallback(async (site: JobSite): Promise<{ ok: boolean }> => {
    setSites((prev) => prev.map((s) => (s.id === site.id ? site : s)));
    try {
      await updateJobSiteRepo(site);
      return { ok: true };
    } catch {
      // Rollback: refetch
      fetchJobSites().then(setSites).catch(console.error);
      return { ok: false };
    }
  }, []);

  const deleteSite = useCallback(async (id: string): Promise<{ ok: boolean }> => {
    const backup = sites;
    setSites((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteJobSiteRepo(id);
      return { ok: true };
    } catch {
      setSites(backup);
      return { ok: false };
    }
  }, [sites]);

  return { sites, loaded, addSite, updateSite, deleteSite };
}
