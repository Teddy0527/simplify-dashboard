import { useMemo } from 'react';
import { EntrySheet } from '@jobsimplify/shared';
import ESCard from './ESCard';

interface ESListProps {
  entrySheets: EntrySheet[];
  viewMode: 'generic' | 'company';
  onCardClick: (entrySheet: EntrySheet) => void;
  onCopy: (entrySheet: EntrySheet) => void;
  onCreateNew?: () => void;
}

export default function ESList({ entrySheets, viewMode, onCardClick, onCopy, onCreateNew }: ESListProps) {
  const { groups, items } = useMemo(() => {
    // Sort by updatedAt (most recent first)
    const sorted = [...entrySheets].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    if (viewMode === 'generic') {
      return { groups: {} as Record<string, EntrySheet[]>, items: sorted };
    }

    // Group by company for company view
    const grouped: Record<string, EntrySheet[]> = {};

    for (const es of sorted) {
      const companyName = es.companyName || '企業未設定';
      if (!grouped[companyName]) {
        grouped[companyName] = [];
      }
      grouped[companyName].push(es);
    }

    return { groups: grouped, items: [] as EntrySheet[] };
  }, [entrySheets, viewMode]);

  const companyNames = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'ja'));
  const hasContent = viewMode === 'generic'
    ? items.length > 0
    : companyNames.length > 0;

  if (!hasContent) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="text-center max-w-md px-6">
          {/* 大きめのイラストアイコン */}
          <div className="w-24 h-24 mx-auto mb-6 bg-primary-50 rounded-2xl flex items-center justify-center">
            <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          {/* メッセージ */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {viewMode === 'generic'
              ? 'テンプレートを作成しましょう'
              : '企業別ESを作成しましょう'}
          </h3>
          <p className="text-sm text-gray-500 mb-8">
            {viewMode === 'generic'
              ? 'よく使う回答をテンプレートとして保存しておくと、複数の企業で使い回せます'
              : 'テンプレートをコピーして、企業向けにカスタマイズできます'}
          </p>

          {/* ステップバイステップのガイダンス */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold mb-2">
                1
              </div>
              <span className="text-xs text-gray-600">作成</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-200 mt-[-12px]"></div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-sm font-semibold mb-2">
                2
              </div>
              <span className="text-xs text-gray-400">コピー</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-200 mt-[-12px]"></div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-sm font-semibold mb-2">
                3
              </div>
              <span className="text-xs text-gray-400">カスタマイズ</span>
            </div>
          </div>

          {/* CTAボタン */}
          {viewMode === 'generic' && onCreateNew && (
            <button
              onClick={onCreateNew}
              className="btn-primary text-sm py-2.5 px-6 flex items-center gap-2 mx-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              最初のテンプレートを作成
            </button>
          )}

          {viewMode === 'company' && (
            <p className="text-xs text-gray-400">
              まずテンプレートタブで汎用ESを作成してください
            </p>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === 'generic') {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(es => (
            <ESCard
              key={es.id}
              entrySheet={es}
              onClick={() => onCardClick(es)}
              onCopy={() => onCopy(es)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {companyNames.map(companyName => (
        <div key={companyName}>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-500"></span>
            {companyName}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups[companyName].map(es => (
              <ESCard
                key={es.id}
                entrySheet={es}
                onClick={() => onCardClick(es)}
                onCopy={() => onCopy(es)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
