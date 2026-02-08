import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEntrySheetContext } from '../../contexts/EntrySheetContext';

interface DrawerDocumentsTabProps {
  companyId: string;
  companyName: string;
}

export default function DrawerDocumentsTab({ companyId }: DrawerDocumentsTabProps) {
  const navigate = useNavigate();
  const { entrySheets } = useEntrySheetContext();

  const companyES = useMemo(
    () => entrySheets.filter((es) => es.companyId === companyId),
    [entrySheets, companyId],
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800 tracking-wide">
          エントリーシート
          {companyES.length > 0 && (
            <span className="ml-1.5 text-xs font-normal text-gray-500">({companyES.length})</span>
          )}
        </h3>
        <button
          onClick={() => navigate(`/es?company=${companyId}&action=create`)}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-0.5"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          ES作成
        </button>
      </div>

      {companyES.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-300 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400 mb-3">ESはまだありません</p>
          <button
            onClick={() => navigate(`/es?company=${companyId}&action=create`)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            ESを作成する
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {companyES.map((es) => {
            const answered = es.questions.filter((q) => q.answer?.trim()).length;
            const total = es.questions.length;
            const hasFreeform =
              !!es.freeformContent &&
              es.freeformContent.replace(/<[^>]*>/g, '').trim().length > 0;
            const hasLinks = !!es.externalLinks && es.externalLinks.length > 0;

            return (
              <div
                key={es.id}
                onClick={() => navigate(`/es?company=${companyId}`)}
                className="p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <p className="text-sm font-medium text-gray-900 truncate">{es.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {total > 0 && (
                    <span className="text-xs text-gray-500">
                      {answered}/{total}設問
                    </span>
                  )}
                  {hasFreeform && (
                    <span className="text-xs text-gray-400" title="フリーフォーム">
                      <svg className="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </span>
                  )}
                  {hasLinks && (
                    <span className="text-xs text-gray-400" title="外部リンク">
                      <svg className="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {companyES.length > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate(`/es?company=${companyId}`)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            ES管理画面で開く
          </button>
        </div>
      )}
    </div>
  );
}
