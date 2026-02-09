import { useMemo } from 'react';
import { EntrySheet, Company } from '@jobsimplify/shared';
import { CompanyLogo } from '../ui/CompanyLogo';

export type SelectedCategory =
  | { type: 'template' }
  | { type: 'company'; companyId: string; companyName: string };

interface ESFileManagerSidebarProps {
  entrySheets: EntrySheet[];
  companies: Company[];
  selected: SelectedCategory;
  onSelect: (category: SelectedCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddCompany?: () => void;
}

export default function ESFileManagerSidebar({
  entrySheets,
  companies,
  selected,
  onSelect,
  searchQuery,
  onSearchChange,
  onAddCompany,
}: ESFileManagerSidebarProps) {
  const templateCount = useMemo(
    () => entrySheets.filter(es => !es.companyId).length,
    [entrySheets],
  );

  const companyESData = useMemo(() => {
    const countMap = new Map<string, number>();
    for (const es of entrySheets) {
      if (es.companyId) {
        countMap.set(es.companyId, (countMap.get(es.companyId) || 0) + 1);
      }
    }

    // Include ALL companies (even those with 0 ES)
    const allCompanies = companies
      .map(c => ({
        id: c.id,
        name: c.name,
        logoUrl: c.logoUrl,
        websiteDomain: c.websiteDomain,
        esCount: countMap.get(c.id) || 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ja'));

    // Also add companies that don't exist in company list but have ES entries
    const knownIds = new Set(companies.map(c => c.id));
    for (const es of entrySheets) {
      if (es.companyId && !knownIds.has(es.companyId) && es.companyName) {
        if (!allCompanies.some(c => c.id === es.companyId)) {
          allCompanies.push({
            id: es.companyId,
            name: es.companyName,
            logoUrl: undefined,
            websiteDomain: undefined,
            esCount: countMap.get(es.companyId) || 0,
          });
        }
      }
    }

    return allCompanies;
  }, [companies, entrySheets]);

  // Mobile: dropdown
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;

  if (isMobileView) {
    return (
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ESを検索..."
            className="input-field flex-1 text-sm"
          />
          <select
            value={selected.type === 'template' ? '__template__' : selected.companyId}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '__template__') {
                onSelect({ type: 'template' });
              } else {
                const comp = companyESData.find(c => c.id === val);
                if (comp) {
                  onSelect({ type: 'company', companyId: comp.id, companyName: comp.name });
                }
              }
            }}
            className="select-field text-sm w-auto"
          >
            <option value="__template__">テンプレート ({templateCount})</option>
            {companyESData.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.esCount})</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="w-60 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ESを検索..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-3">
        {/* Template section (top, always visible) */}
        <div className="px-3 pb-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">テンプレート</span>
        </div>
        <button
          onClick={() => onSelect({ type: 'template' })}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
            selected.type === 'template'
              ? 'bg-primary-50 text-primary-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="flex-1 text-left truncate">すべてのテンプレート</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            selected.type === 'template'
              ? 'bg-primary-200 text-primary-700'
              : 'bg-gray-200 text-gray-500'
          }`}>
            {templateCount}
          </span>
        </button>

        {/* Divider */}
        <div className="my-3 border-t border-gray-200" />

        {/* Company section (bottom) */}
        <div className="px-3 pb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">企業別</span>
          {onAddCompany && (
            <button
              onClick={onAddCompany}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-0.5 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              企業追加
            </button>
          )}
        </div>
        {companyESData.length > 0 ? (
          companyESData.map(company => (
            <button
              key={company.id}
              onClick={() => onSelect({ type: 'company', companyId: company.id, companyName: company.name })}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
                selected.type === 'company' && selected.companyId === company.id
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <CompanyLogo
                name={company.name}
                logoUrl={company.logoUrl}
                websiteDomain={company.websiteDomain}
                size="sm"
                className="flex-shrink-0"
              />
              <span className="flex-1 text-left truncate">{company.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                selected.type === 'company' && selected.companyId === company.id
                  ? 'bg-primary-200 text-primary-700'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {company.esCount}
              </span>
            </button>
          ))
        ) : (
          <div className="px-3 py-2">
            <p className="text-xs text-gray-400">企業がまだ登録されていません</p>
            {onAddCompany && (
              <button
                onClick={onAddCompany}
                className="mt-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                最初の企業を追加
              </button>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}
