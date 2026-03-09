import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Company, CachedEmail, EmailsByCompany, EmailsByTier, EmailTier } from '@jobsimplify/shared';
import { TIER_LABELS } from '@jobsimplify/shared';
import { getCachedEmails } from '@jobsimplify/shared';

interface UseAllEmailsReturn {
  emails: CachedEmail[];
  emailsByCompany: EmailsByCompany[];
  emailsByTier: EmailsByTier[];
  unmatchedEmails: CachedEmail[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useAllEmails(companies: Company[]): UseAllEmailsReturn {
  const [emails, setEmails] = useState<CachedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCachedEmails();
      setEmails(data);
    } catch {
      setEmails([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const companyMap = useMemo(() => {
    const map = new Map<string, Company>();
    for (const c of companies) {
      map.set(c.id, c);
    }
    return map;
  }, [companies]);

  const { emailsByCompany, unmatchedEmails } = useMemo(() => {
    const grouped = new Map<string, CachedEmail[]>();
    const unmatched: CachedEmail[] = [];

    for (const email of emails) {
      if (email.companyId) {
        const list = grouped.get(email.companyId) ?? [];
        list.push(email);
        grouped.set(email.companyId, list);
      } else {
        unmatched.push(email);
      }
    }

    const byCompany: EmailsByCompany[] = [];
    for (const [companyId, companyEmails] of grouped) {
      const company = companyMap.get(companyId);
      byCompany.push({
        companyId,
        companyName: company?.name ?? 'Unknown',
        logoUrl: company?.logoUrl,
        emails: companyEmails,
        totalCount: companyEmails.length,
      });
    }

    // Sort by most recent email
    byCompany.sort((a, b) => {
      const aDate = a.emails[0]?.receivedAt ?? '';
      const bDate = b.emails[0]?.receivedAt ?? '';
      return bDate.localeCompare(aDate);
    });

    return { emailsByCompany: byCompany, unmatchedEmails: unmatched };
  }, [emails, companyMap]);

  const emailsByTier = useMemo(() => {
    const tierOrder: EmailTier[] = ['tier1', 'tier2', 'tier3', 'tier4'];
    const grouped = new Map<EmailTier, CachedEmail[]>();

    for (const email of emails) {
      const tier = email.classification ?? 'tier4';
      const list = grouped.get(tier) ?? [];
      list.push(email);
      grouped.set(tier, list);
    }

    return tierOrder
      .map((tier) => ({
        tier,
        label: TIER_LABELS[tier],
        emails: grouped.get(tier) ?? [],
      }))
      .filter((g) => g.emails.length > 0);
  }, [emails]);

  return {
    emails,
    emailsByCompany,
    emailsByTier,
    unmatchedEmails,
    isLoading,
    refresh: load,
  };
}
