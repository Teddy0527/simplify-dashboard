import { useMemo } from 'react';
import { EntrySheet } from '@entrify/shared';
import ESCard from './ESCard';
import type { SelectedCategory } from './ESFileManagerSidebar';

interface ESFileManagerContentProps {
  entrySheets: EntrySheet[];
  selected: SelectedCategory;
  searchQuery: string;
  onCardClick: (entrySheet: EntrySheet) => void;
  onCopy: (entrySheet: EntrySheet) => void;
  onUseAsCompanyES?: (entrySheet: EntrySheet) => void;
  onCreateNew: () => void;
  onCreateTemplate?: () => void;
}

export default function ESFileManagerContent({
  entrySheets,
  selected,
  searchQuery,
  onCardClick,
  onCopy,
  onUseAsCompanyES,
  onCreateNew,
  onCreateTemplate,
}: ESFileManagerContentProps) {
  const filtered = useMemo(() => {
    let items: EntrySheet[];

    if (selected.type === 'template') {
      items = entrySheets.filter(es => !es.companyId);
    } else {
      items = entrySheets.filter(es => es.companyId === selected.companyId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter(es => es.title.toLowerCase().includes(q));
    }

    return items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [entrySheets, selected, searchQuery]);

  // Calculate version numbers for company ES (by createdAt ascending order)
  const versionMap = useMemo(() => {
    if (selected.type === 'template') return new Map<string, number>();
    const companyItems = entrySheets
      .filter(es => es.companyId === selected.companyId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const map = new Map<string, number>();
    companyItems.forEach((es, i) => map.set(es.id, i + 1));
    return map;
  }, [entrySheets, selected]);

  const breadcrumb = selected.type === 'template' ? 'テンプレート' : selected.companyName;
  const companyName = selected.type === 'company' ? selected.companyName : '';

  if (filtered.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <span>ES管理</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">{breadcrumb}</span>
        </div>

        <div className="flex-1 flex items-center justify-center py-12">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-4 bg-primary-50 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery
                ? '検索結果がありません'
                : selected.type === 'company'
                  ? `${companyName}のESを作成しましょう`
                  : 'ESがまだありません'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchQuery
                ? `「${searchQuery}」に一致するESが見つかりませんでした`
                : selected.type === 'template'
                  ? 'テンプレートを作成して、企業ESの土台にしましょう'
                  : 'テンプレートをコピーして、またはゼロから新規ESを作成できます'}
            </p>
            {!searchQuery && (
              selected.type === 'template' && onCreateTemplate ? (
                <button
                  onClick={onCreateTemplate}
                  className="btn-primary text-sm py-2.5 px-6 flex items-center gap-2 mx-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  テンプレート作成
                </button>
              ) : (
                <button
                  onClick={onCreateNew}
                  className="btn-primary text-sm py-2.5 px-6 flex items-center gap-2 mx-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  新規ES作成
                </button>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <span>ES管理</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium">{breadcrumb}</span>
        <span className="text-gray-400 ml-1">({filtered.length})</span>
      </div>

      {/* Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(es => (
          <ESCard
            key={es.id}
            entrySheet={es}
            version={versionMap.get(es.id)}
            onClick={() => onCardClick(es)}
            onCopy={() => onCopy(es)}
            onUseAsCompanyES={
              selected.type === 'template' && onUseAsCompanyES
                ? () => onUseAsCompanyES(es)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
