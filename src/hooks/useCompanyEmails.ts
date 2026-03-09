import { useState, useEffect, useCallback } from 'react';
import type { CachedEmail } from '@jobsimplify/shared';
import { getCachedEmails } from '@jobsimplify/shared';

interface UseCompanyEmailsReturn {
  emails: CachedEmail[];
  emailCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useCompanyEmails(companyId: string | undefined): UseCompanyEmailsReturn {
  const [emails, setEmails] = useState<CachedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) {
      setEmails([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getCachedEmails({ companyId, limit: 10 });
      setEmails(data);
    } catch {
      setEmails([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    emails,
    emailCount: emails.length,
    isLoading,
    refresh: load,
  };
}
