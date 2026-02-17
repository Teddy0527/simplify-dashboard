import { useState, useCallback, useEffect } from 'react';
import { Company, SelectionStatus } from '@jobsimplify/shared';
import { useAuth } from '../shared/hooks/useAuth';
import {
  getCompanies as fetchCompanies,
  addCompany as addCompanyRepo,
  updateCompany as updateCompanyRepo,
  deleteCompany as deleteCompanyRepo,
  trackEventAsync,
  trackMilestoneOnce,
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
    const company = companies.find((c) => c.id === id);
    const fromStatus = company?.status;
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c
      )
    );
    if (company) {
      await updateCompanyRepo({ ...company, status, updatedAt: new Date().toISOString() }).catch(console.error);
      trackEventAsync('company.status_change', {
        companyId: id,
        fromStatus,
        toStatus: status,
        source: 'drawer',
      });
      trackMilestoneOnce('milestone.first_status_change');
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

    // ステータス変更をデータベースに保存 & トラッキング
    for (const company of statusChanges) {
      try {
        const oldCompany = companies.find((c) => c.id === company.id);
        await updateCompanyRepo(company);
        trackEventAsync('company.status_change', {
          companyId: company.id,
          fromStatus: oldCompany?.status,
          toStatus: company.status,
          source: 'kanban_drag',
        });
        trackMilestoneOnce('milestone.first_status_change');
      } catch (error) {
        console.error('Failed to persist status change:', error);
      }
    }
  }, [companies]);

  const addCompany = useCallback(async (company: Company) => {
    setCompanies((prev) => {
      const newList = [company, ...prev];
      // Milestone tracking based on new count
      if (newList.length === 1) trackMilestoneOnce('milestone.first_company');
      if (newList.length === 3) trackMilestoneOnce('milestone.third_company');
      return newList;
    });
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
