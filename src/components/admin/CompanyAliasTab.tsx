import { useState, useEffect, useCallback } from 'react';
import {
  getSupabase,
  getAliasesForCompany,
  addAlias,
  deleteAlias,
} from '@jobsimplify/shared';
import type { CompanyNameAlias, AliasType } from '@jobsimplify/shared';

interface CompanyResult {
  id: string;
  name: string;
  industry: string | null;
  logo_url: string | null;
  alias_count: number;
}

const ALIAS_TYPE_LABELS: Record<AliasType, string> = {
  english: '英語名',
  abbreviation: '略称',
  nickname: '通称',
  old_name: '旧名',
  other: 'その他',
};

const ALIAS_TYPE_COLORS: Record<AliasType, string> = {
  english: 'bg-blue-50 text-blue-700',
  abbreviation: 'bg-purple-50 text-purple-700',
  nickname: 'bg-green-50 text-green-700',
  old_name: 'bg-amber-50 text-amber-700',
  other: 'bg-gray-100 text-gray-600',
};

export default function CompanyAliasTab() {
  const [query, setQuery] = useState('');
  const [companies, setCompanies] = useState<CompanyResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<CompanyResult | null>(null);
  const [aliases, setAliases] = useState<CompanyNameAlias[]>([]);
  const [loadingAliases, setLoadingAliases] = useState(false);

  // Add form
  const [newAlias, setNewAlias] = useState('');
  const [newType, setNewType] = useState<AliasType>('english');
  const [adding, setAdding] = useState(false);

  const searchCompanies = useCallback(async (q: string) => {
    if (q.trim().length === 0) {
      setCompanies([]);
      return;
    }
    setSearching(true);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('company_master')
        .select(`
          id, name, industry, logo_url,
          company_name_aliases(count)
        `)
        .ilike('name', `%${q}%`)
        .order('is_popular', { ascending: false })
        .order('name')
        .limit(20);

      if (error) throw error;

      setCompanies(
        (data ?? []).map((row: any) => ({
          id: row.id,
          name: row.name,
          industry: row.industry,
          logo_url: row.logo_url,
          alias_count: row.company_name_aliases?.[0]?.count ?? 0,
        }))
      );
    } catch {
      setCompanies([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => searchCompanies(query), 300);
    return () => clearTimeout(timer);
  }, [query, searchCompanies]);

  const loadAliases = useCallback(async (companyId: string) => {
    setLoadingAliases(true);
    try {
      const data = await getAliasesForCompany(companyId);
      setAliases(data);
    } catch {
      setAliases([]);
    } finally {
      setLoadingAliases(false);
    }
  }, []);

  const handleSelect = (company: CompanyResult) => {
    setSelected(company);
    loadAliases(company.id);
  };

  const handleAdd = async () => {
    if (!selected || !newAlias.trim()) return;
    setAdding(true);
    try {
      const created = await addAlias(selected.id, newAlias.trim(), newType);
      setAliases((prev) => [...prev, created]);
      setNewAlias('');
      // Update count in company list
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === selected.id ? { ...c, alias_count: c.alias_count + 1 } : c
        )
      );
    } catch (err) {
      console.error('Failed to add alias:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (aliasId: string) => {
    if (!selected) return;
    try {
      await deleteAlias(aliasId);
      setAliases((prev) => prev.filter((a) => a.id !== aliasId));
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === selected.id ? { ...c, alias_count: Math.max(0, c.alias_count - 1) } : c
        )
      );
    } catch (err) {
      console.error('Failed to delete alias:', err);
    }
  };

  return (
    <div className="flex gap-6 min-h-[500px]">
      {/* Left: Company search */}
      <div className="w-80 flex-shrink-0">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input-field w-full mb-3"
          placeholder="企業名で検索..."
        />

        {searching && (
          <div className="text-center py-6 text-gray-500">
            <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
          </div>
        )}

        {!searching && companies.length > 0 && (
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selected?.id === c.id
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {c.logo_url ? (
                    <img
                      src={c.logo_url}
                      alt=""
                      className="w-6 h-6 rounded object-contain bg-white border border-gray-100 flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-medium flex-shrink-0">
                      {c.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400">
                      {c.industry ?? '業界未設定'}
                      {c.alias_count > 0 && ` / ${c.alias_count}件のエイリアス`}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {!searching && query && companies.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">該当する企業がありません</p>
        )}
      </div>

      {/* Right: Alias management */}
      <div className="flex-1">
        {!selected ? (
          <div className="text-center py-20 text-gray-400">
            <svg
              className="mx-auto mb-3 w-12 h-12 text-gray-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm">左のパネルから企業を選択してください</p>
          </div>
        ) : (
          <div>
            {/* Selected company header */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              {selected.logo_url ? (
                <img
                  src={selected.logo_url}
                  alt=""
                  className="w-10 h-10 rounded object-contain bg-white border border-gray-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 font-medium">
                  {selected.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-base font-semibold text-gray-900">{selected.name}</h3>
                <p className="text-xs text-gray-400">{selected.industry ?? '業界未設定'}</p>
              </div>
            </div>

            {/* Aliases */}
            {loadingAliases ? (
              <div className="text-center py-8">
                <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {aliases.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4">エイリアスはまだ登録されていません</p>
                ) : (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {aliases.map((a) => (
                      <span
                        key={a.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${
                          ALIAS_TYPE_COLORS[a.aliasType]
                        }`}
                      >
                        <span className="text-[10px] font-medium opacity-70">
                          {ALIAS_TYPE_LABELS[a.aliasType]}
                        </span>
                        <span className="font-medium">{a.alias}</span>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                          title="削除"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add form */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">エイリアス追加</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAlias}
                      onChange={(e) => setNewAlias(e.target.value)}
                      className="input-field flex-1 text-sm"
                      placeholder="エイリアス名（例: BCG, McKinsey）"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newAlias.trim()) handleAdd();
                      }}
                    />
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as AliasType)}
                      className="select-field text-sm w-28"
                    >
                      {(Object.keys(ALIAS_TYPE_LABELS) as AliasType[]).map((t) => (
                        <option key={t} value={t}>
                          {ALIAS_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAdd}
                      disabled={adding || !newAlias.trim()}
                      className="btn-primary text-sm px-4 py-2 whitespace-nowrap"
                    >
                      {adding ? '追加中...' : '追加'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
