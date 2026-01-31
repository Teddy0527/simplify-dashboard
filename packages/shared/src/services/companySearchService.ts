import type { CompanySearchResult } from '../types/companySearch';

const API_BASE = 'https://api.houjin-bangou.nta.go.jp/4/name';

export async function searchCompanies(
  query: string,
  appId: string,
): Promise<CompanySearchResult[]> {
  if (!query.trim() || query.trim().length < 2) return [];

  const params = new URLSearchParams({
    id: appId,
    name: query.trim(),
    type: '12', // JSON response (Unicode)
    mode: '2',  // 前方一致
    target: '1', // JIS第一・第二水準
    change: '0',
    close: '0', // 閉鎖していない法人のみ
  });

  const res = await fetch(`${API_BASE}?${params}`);
  if (!res.ok) return [];

  const data = await res.json();

  if (!data.corporations || !Array.isArray(data.corporations)) return [];

  return data.corporations.slice(0, 10).map((corp: Record<string, string>) => ({
    corporateNumber: corp.corporateNumber || '',
    name: corp.name || '',
    address: [corp.prefectureName, corp.cityName, corp.streetNumber]
      .filter(Boolean)
      .join(''),
  }));
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function searchCompaniesDebounced(
  query: string,
  appId: string,
  callback: (results: CompanySearchResult[]) => void,
  delay = 300,
): () => void {
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    const results = await searchCompanies(query, appId);
    callback(results);
  }, delay);

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
  };
}
