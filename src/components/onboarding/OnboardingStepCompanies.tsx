import { useState, useCallback, useEffect } from 'react';
import { CompanyAutocomplete } from '../CompanyAutocomplete';
import { CompanyLogo } from '../ui/CompanyLogo';
import {
  getSupabase,
  toCompanySearchResult,
} from '@jobsimplify/shared';
import type { CompanySearchResult, CompanySearchResultRow } from '@jobsimplify/shared';

interface OnboardingStepCompaniesProps {
  selectedCompanies: CompanySearchResult[];
  onAdd: (company: CompanySearchResult) => void;
  onRemove: (id: string) => void;
}

export default function OnboardingStepCompanies({
  selectedCompanies,
  onAdd,
  onRemove,
}: OnboardingStepCompaniesProps) {
  const [searchValue, setSearchValue] = useState('');
  const [popularCompanies, setPopularCompanies] = useState<CompanySearchResult[]>([]);

  // 人気企業を取得
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getSupabase()
          .from('company_master')
          .select('id, name, name_kana, industry, logo_url, website_url, website_domain, mypage_url, recruit_url, is_popular')
          .eq('is_popular', true)
          .order('popularity_rank', { ascending: true, nullsFirst: false })
          .limit(12);
        if (cancelled || !data) return;
        setPopularCompanies(
          data.map((row) =>
            toCompanySearchResult({ ...row, similarity_score: 0 } as CompanySearchResultRow)
          ),
        );
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const selectedIds = new Set(selectedCompanies.map((c) => c.id));

  const handleSelect = useCallback(
    (company: CompanySearchResult) => {
      if (selectedIds.has(company.id)) return;
      onAdd(company);
      setSearchValue('');
    },
    [selectedIds, onAdd],
  );

  // 人気企業のうち未選択のもの
  const unselectedPopular = popularCompanies.filter((c) => !selectedIds.has(c.id));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">興味のある企業を追加しよう</h2>
        <p className="mt-1 text-sm text-gray-500">
          気になる企業を選ぶと、ダッシュボードにすぐ表示されます
        </p>
      </div>

      {/* 検索 */}
      <CompanyAutocomplete
        value={searchValue}
        onChange={setSearchValue}
        onSelect={handleSelect}
        placeholder="企業を検索..."
      />

      {/* 人気企業チップ */}
      {unselectedPopular.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2">人気の企業</p>
          <div className="flex flex-wrap gap-2">
            {unselectedPopular.map((company) => (
              <button
                key={company.id}
                type="button"
                onClick={() => handleSelect(company)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-sm text-gray-700 hover:border-primary-400 hover:bg-primary-50 transition-colors"
              >
                <CompanyLogo
                  name={company.name}
                  logoUrl={company.logoUrl}
                  websiteDomain={company.websiteDomain ?? company.websiteUrl}
                  size="sm"
                  className="w-5 h-5 rounded text-[10px] flex-shrink-0"
                />
                <span className="truncate max-w-[120px]">{company.name}</span>
                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 選択済みリスト */}
      {selectedCompanies.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2">
            {selectedCompanies.length}社 選択済み
          </p>
          <ul className="space-y-2">
            {selectedCompanies.map((company) => (
              <li
                key={company.id}
                className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg border border-primary-200"
              >
                <CompanyLogo
                  name={company.name}
                  logoUrl={company.logoUrl}
                  websiteDomain={company.websiteDomain ?? company.websiteUrl}
                  size="sm"
                  className="w-8 h-8 rounded-md text-sm flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{company.name}</p>
                  {company.industry && (
                    <p className="text-xs text-gray-500 truncate">{company.industry}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(company.id)}
                  className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  aria-label={`${company.name}を削除`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
