import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { searchDeadlinePresets, DeadlinePresetWithCompany } from '@simplify/shared';

export interface CompanyGroup {
  companyMasterId: string;
  companyName: string;
  companyIndustry?: string;
  companyLogoUrl?: string;
  companyWebsiteDomain?: string;
  deadlines: DeadlinePresetWithCompany[];
}

export function useDeadlinePresets(query: string, year: number, industry?: string) {
  const [results, setResults] = useState<DeadlinePresetWithCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchPresets = useCallback(async (q: string, y: number) => {
    setLoading(true);
    try {
      const data = await searchDeadlinePresets(q, y, 200, 0);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPresets(query, year);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, year, fetchPresets]);

  const filtered = useMemo(() => {
    if (!industry) return results;
    return results.filter(r => r.companyIndustry?.includes(industry));
  }, [results, industry]);

  const grouped = useMemo(() => {
    const map = new Map<string, CompanyGroup>();
    for (const r of filtered) {
      const existing = map.get(r.companyMasterId);
      if (existing) {
        existing.deadlines.push(r);
      } else {
        map.set(r.companyMasterId, {
          companyMasterId: r.companyMasterId,
          companyName: r.companyName,
          companyIndustry: r.companyIndustry,
          companyLogoUrl: r.companyLogoUrl,
          companyWebsiteDomain: r.companyWebsiteDomain,
          deadlines: [r],
        });
      }
    }
    return Array.from(map.values());
  }, [filtered]);

  const byDate = useMemo(() => {
    const map = new Map<string, DeadlinePresetWithCompany[]>();
    for (const r of filtered) {
      const list = map.get(r.deadlineDate) || [];
      list.push(r);
      map.set(r.deadlineDate, list);
    }
    return map;
  }, [filtered]);

  return { grouped, byDate, loading };
}
