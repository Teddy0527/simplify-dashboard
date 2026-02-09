import { useState, useCallback, useEffect } from 'react';
import { Company, SelectionStatus } from '@jobsimplify/shared';
import { useAuth } from '../shared/hooks/useAuth';
import {
  getCompanies as fetchCompanies,
  addCompany as addCompanyRepo,
  updateCompany as updateCompanyRepo,
  deleteCompany as deleteCompanyRepo,
} from '@jobsimplify/shared';

export function useCompanies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from Supabase when user changes
  useEffect(() => {
    setLoaded(false);
    fetchCompanies().then((data) => {
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
      await updateCompanyRepo({ ...company, status, updatedAt: new Date().toISOString() }).catch(console.error);
    }
  }, [companies]);

  const reorder = useCallback(async (newCompanies: Company[]) => {
    // ステータスが変更されたカードを検出
    const statusChanges = newCompanies.filter((newCompany) => {
      const oldCompany = companies.find((c) => c.id === newCompany.id);
      return oldCompany && oldCompany.status !== newCompany.status;
    });

    // 即座にローカルステートを更新（楽観的更新）
    setCompanies(newCompanies);

    // ステータス変更をデータベースに保存
    for (const company of statusChanges) {
      try {
        await updateCompanyRepo(company);
      } catch (error) {
        console.error('Failed to persist status change:', error);
      }
    }
  }, [companies]);

  const addCompany = useCallback(async (company: Company) => {
    setCompanies((prev) => [company, ...prev]);
    await addCompanyRepo(company).catch(console.error);
  }, []);

  const updateCompany = useCallback(async (company: Company) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === company.id ? company : c))
    );
    await updateCompanyRepo(company).catch(console.error);
  }, []);

  const deleteCompany = useCallback(async (id: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    await deleteCompanyRepo(id).catch(console.error);
  }, []);

  return { companies, loaded, updateStatus, reorder, addCompany, updateCompany, deleteCompany };
}
