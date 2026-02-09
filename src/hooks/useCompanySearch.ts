import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getSupabase,
  CompanySearchResult,
  CompanySearchResultRow,
  toCompanySearchResult,
} from '@entrify/shared';

interface UseCompanySearchOptions {
  debounceMs?: number;
  limit?: number;
  minQueryLength?: number;
}

interface UseCompanySearchReturn {
  results: CompanySearchResult[];
  loading: boolean;
  error: string | null;
  search: (query: string) => void;
  clearResults: () => void;
}

/**
 * 企業マスター検索Hook
 *
 * @param options.debounceMs - デバウンス時間（デフォルト: 300ms）
 * @param options.limit - 検索結果の最大件数（デフォルト: 10）
 * @param options.minQueryLength - 検索を実行する最小文字数（デフォルト: 1）
 */
export function useCompanySearch(
  options: UseCompanySearchOptions = {}
): UseCompanySearchReturn {
  const { debounceMs = 300, limit = 10, minQueryLength = 1 } = options;

  const [results, setResults] = useState<CompanySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const executeSearch = useCallback(
    async (query: string) => {
      // 前回のリクエストをキャンセル
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabase();
        const { data, error: rpcError } = await supabase.rpc(
          'search_company_master',
          {
            search_query: query,
            result_limit: limit,
          }
        );

        // アボートされた場合は無視
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        if (rpcError) {
          throw new Error(rpcError.message);
        }

        const searchResults = (data as CompanySearchResultRow[] | null) ?? [];
        setResults(searchResults.map(toCompanySearchResult));
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err.message : '検索中にエラーが発生しました');
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  const search = useCallback(
    (query: string) => {
      // 既存のタイマーをクリア
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // クエリが短すぎる場合は結果をクリア
      if (query.length < minQueryLength) {
        setResults([]);
        setLoading(false);
        return;
      }

      // デバウンス
      debounceTimerRef.current = setTimeout(() => {
        executeSearch(query);
      }, debounceMs);
    },
    [debounceMs, minQueryLength, executeSearch]
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { results, loading, error, search, clearResults };
}
