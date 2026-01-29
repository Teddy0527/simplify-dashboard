import { useState, useCallback, useEffect } from 'react';
import { Company, SelectionStatus } from '../shared/types';
import { getStorageAdapter } from '../shared/storage/storageAdapter';
import { MOCK_COMPANIES } from '../mockData';

const adapter = getStorageAdapter();

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>(MOCK_COMPANIES);
  const [loaded, setLoaded] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    adapter.getCompanies().then((stored) => {
      if (stored.length > 0) {
        setCompanies(stored);
      }
      setLoaded(true);
    });
  }, []);

  // Persist whenever companies change (after initial load)
  useEffect(() => {
    if (loaded) {
      adapter.setCompanies(companies);
    }
  }, [companies, loaded]);

  const updateStatus = useCallback((id: string, status: SelectionStatus) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c
      )
    );
  }, []);

  const reorder = useCallback((newCompanies: Company[]) => {
    setCompanies(newCompanies);
  }, []);

  const addCompany = useCallback((company: Company) => {
    setCompanies((prev) => [company, ...prev]);
  }, []);

  const updateCompany = useCallback((company: Company) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === company.id ? company : c))
    );
  }, []);

  const deleteCompany = useCallback((id: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { companies, loaded, updateStatus, reorder, addCompany, updateCompany, deleteCompany };
}
