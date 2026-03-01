import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getSupabase,
  CompanySearchResult,
  CompanySearchResultRow,
  toCompanySearchResult,
} from '@jobsimplify/shared';
import type { NtaCompanyResult } from '@jobsimplify/shared';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface UseCompanySearchOptions {
  debounceMs?: number;
  limit?: number;
  minQueryLength?: number;
}

interface UseCompanySearchReturn {
  results: CompanySearchResult[];
  popularCompanies: CompanySearchResult[];
  loading: boolean;
  error: string | null;
  search: (query: string) => void;
  clearResults: () => void;
  // NTA補助検索（オプトイン）
  ntaResults: CompanySearchResult[];
  ntaLoading: boolean;
  searchNtaManually: (query: string) => void;
  clearNtaResults: () => void;
}

/**
 * 法人格を除去して正規化（重複排除用）
 */
function normalizeName(name: string): string {
  return name
    .replace(/[\s　]+/g, '')
    .replace(/株式会社|有限会社|合同会社|合名会社|合資会社|一般社団法人|一般財団法人|公益社団法人|公益財団法人|特定非営利活動法人|独立行政法人|地方独立行政法人|国立大学法人/g, '')
    .trim();
}

/**
 * NTA結果をCompanySearchResultに変換
 */
function ntaToCompanySearchResult(nta: NtaCompanyResult): CompanySearchResult {
  return {
    id: `nta-${nta.corporateNumber}`,
    name: nta.name,
    nameKana: nta.nameKana,
    isPopular: false,
    similarityScore: 0,
    source: 'nta',
    corporateNumber: nta.corporateNumber,
    address: nta.address,
  };
}

/**
 * NTA Edge Function を呼び出す
 */
async function searchNta(query: string, maxCount = 5): Promise<NtaCompanyResult[]> {
  const url = `${SUPABASE_URL}/functions/v1/company-search-nta?q=${encodeURIComponent(query)}&maxCount=${maxCount}`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

/**
 * 企業マスター検索Hook（NTA法人番号API統合）
 * NTAは自動発火せず、searchNtaManually で明示的に呼び出す
 */
export function useCompanySearch(
  options: UseCompanySearchOptions = {}
): UseCompanySearchReturn {
  const { debounceMs = 300, limit = 10, minQueryLength = 1 } = options;

  const [results, setResults] = useState<CompanySearchResult[]>([]);
  const [popularCompanies, setPopularCompanies] = useState<CompanySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NTA補助検索用state
  const [ntaResults, setNtaResults] = useState<CompanySearchResult[]>([]);
  const [ntaLoading, setNtaLoading] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTokenRef = useRef(0);

  // Fetch popular companies on mount (once)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = getSupabase();
        const { data, error: fetchError } = await supabase
          .from('company_master')
          .select('id, name, name_kana, industry, logo_url, website_url, website_domain, mypage_url, recruit_url, is_popular')
          .eq('is_popular', true)
          .order('popularity_rank', { ascending: true, nullsFirst: false })
          .limit(12);

        if (cancelled) return;

        if (fetchError) {
          console.warn('Failed to fetch popular companies:', fetchError.message);
          return;
        }

        if (data) {
          const mapped: CompanySearchResult[] = data.map((row) =>
            toCompanySearchResult({
              ...row,
              similarity_score: 0,
            } as CompanySearchResultRow)
          );
          setPopularCompanies(mapped);
        }
      } catch {
        // silently ignore
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const executeSearch = useCallback(
    async (query: string) => {
      const token = ++searchTokenRef.current;

      setLoading(true);
      setError(null);
      // マスター検索開始時にNTA結果をクリア
      setNtaResults([]);

      try {
        const supabase = getSupabase();
        const { data, error: rpcError } = await supabase.rpc(
          'search_company_master',
          {
            search_query: query,
            result_limit: limit,
          }
        );

        if (searchTokenRef.current !== token) return;

        if (rpcError) {
          throw new Error(rpcError.message);
        }

        const masterResults = ((data as CompanySearchResultRow[] | null) ?? []).map(toCompanySearchResult);
        setResults(masterResults);
      } catch (err) {
        if (searchTokenRef.current !== token) return;
        setError(err instanceof Error ? err.message : '検索中にエラーが発生しました');
        setResults([]);
      } finally {
        if (searchTokenRef.current === token) {
          setLoading(false);
        }
      }
    },
    [limit]
  );

  const search = useCallback(
    (query: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (query.length < minQueryLength) {
        setResults([]);
        setNtaResults([]);
        setLoading(false);
        return;
      }

      debounceTimerRef.current = setTimeout(() => {
        executeSearch(query);
      }, debounceMs);
    },
    [debounceMs, minQueryLength, executeSearch]
  );

  const searchNtaManually = useCallback(
    async (query: string) => {
      if (query.length < 2) return;

      setNtaLoading(true);
      try {
        const rawResults = await searchNta(query, 5);

        // マスター結果との重複排除
        const masterNormalizedNames = new Set(
          results.map((r) => normalizeName(r.name))
        );
        const unique = rawResults
          .filter((nta) => !masterNormalizedNames.has(normalizeName(nta.name)))
          .map(ntaToCompanySearchResult);

        setNtaResults(unique);
      } catch {
        // NTA検索失敗は非致命的
      } finally {
        setNtaLoading(false);
      }
    },
    [results]
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setNtaResults([]);
    setError(null);
  }, []);

  const clearNtaResults = useCallback(() => {
    setNtaResults([]);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      searchTokenRef.current++;
    };
  }, []);

  return {
    results,
    popularCompanies,
    loading,
    error,
    search,
    clearResults,
    ntaResults,
    ntaLoading,
    searchNtaManually,
    clearNtaResults,
  };
}
