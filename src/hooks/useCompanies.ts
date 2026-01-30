import { useState, useCallback, useEffect } from 'react';
import { Company, SelectionStatus } from '../shared/types';
import { useAuth } from '../shared/hooks/useAuth';
import * as repo from '../shared/repositories/applicationRepository';

export function useCompanies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from Supabase when user changes
  useEffect(() => {
    setLoaded(false);
    repo.getCompanies().then((data) => {
      setCompanies(data);
      setLoaded(true);
    }).catch((err) => {
      console.error('Failed to load companies:', err);
      setLoaded(true);
    });
  }, [user?.id]);

  const updateStatus = useCallback(async (id: string, status: SelectionStatus) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c
      )
    );
    const company = companies.find((c) => c.id === id);
    if (company) {
      await repo.updateCompany({ ...company, status, updatedAt: new Date().toISOString() }).catch(console.error);
    }
  }, [companies]);

  const reorder = useCallback((newCompanies: Company[]) => {
    setCompanies(newCompanies);
  }, []);

  const addCompany = useCallback(async (company: Company) => {
    setCompanies((prev) => [company, ...prev]);
    await repo.addCompany(company).catch(console.error);
  }, []);

  const updateCompany = useCallback(async (company: Company) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === company.id ? company : c))
    );
    await repo.updateCompany(company).catch(console.error);
  }, []);

  const deleteCompany = useCallback(async (id: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    await repo.deleteCompany(id).catch(console.error);
  }, []);

  return { companies, loaded, updateStatus, reorder, addCompany, updateCompany, deleteCompany };
}
