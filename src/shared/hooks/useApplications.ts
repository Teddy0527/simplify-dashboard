import { useState, useEffect, useCallback } from 'react';
import {
  getCompanies,
  addCompany as addRepo,
  updateCompany as updateRepo,
  deleteCompany as deleteRepo,
} from '@entrify/shared';
import type { Company } from '@entrify/shared';
import { useAuth } from './useAuth';

export function useApplications() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(async (company: Company) => {
    await addRepo(company);
    await load();
  }, [load]);

  const update = useCallback(async (company: Company) => {
    await updateRepo(company);
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    await deleteRepo(id);
    await load();
  }, [load]);

  return { companies, loading, error, add, update, remove, reload: load };
}
