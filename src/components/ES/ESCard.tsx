import { useMemo } from 'react';
import { EntrySheet } from '@simplify/shared';
import { CompanyLogo } from '../ui/CompanyLogo';

interface ESCardProps {
  entrySheet: EntrySheet;
  version?: number;
  onClick: () => void;
  onCopy: () => void;
  onUseAsCompanyES?: () => void;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay < 7) return `${diffDay}日前`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}週間前`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}ヶ月前`;
  return `${Math.floor(diffDay / 365)}年前`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

export default function ESCard({ entrySheet, version, onClick, onCopy, onUseAsCompanyES }: ESCardProps) {
  const questionCount = entrySheet.questions.length;
  const answeredCount = entrySheet.questions.filter(q => q.answer && q.answer.trim()).length;

  const progress = useMemo(() => {
    if (questionCount === 0) return 0;
    return Math.round((answeredCount / questionCount) * 100);
  }, [answeredCount, questionCount]);

  const progressColorClass = useMemo(() => {
    if (progress === 0) return 'bg-gray-300';
    if (progress === 100) return 'bg-green-500';
    return 'bg-amber-500';
  }, [progress]);

  const relativeTime = formatRelativeTime(entrySheet.updatedAt);

  const hasFreeform = !!entrySheet.freeformContent && entrySheet.freeformContent.replace(/<[^>]*>/g, '').trim().length > 0;
  const freeformCharCount = hasFreeform
    ? entrySheet.freeformContent!.replace(/<[^>]*>/g, '').trim().length
    : 0;
  const hasLinks = !!entrySheet.externalLinks && entrySheet.externalLinks.length > 0;
  const linkCount = entrySheet.externalLinks?.length ?? 0;

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy();
  };

  const handleUseAsCompanyES = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUseAsCompanyES?.();
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
    >
      {/* Title row */}
      <div className="flex items-start gap-3 mb-2">
        {entrySheet.companyName ? (
          <CompanyLogo
            name={entrySheet.companyName}
            size="sm"
            className="flex-shrink-0 mt-0.5"
          />
        ) : (
          <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {entrySheet.title}
          </h3>
          {entrySheet.companyName && (
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {entrySheet.companyName}
            </p>
          )}
        </div>
      </div>

      {/* Content indicators */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {questionCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {answeredCount}/{questionCount}
          </span>
        )}
        {hasFreeform && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            {freeformCharCount}字
          </span>
        )}
        {hasLinks && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {linkCount}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {questionCount > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{answeredCount}/{questionCount}設問</span>
            <span className={progress === 100 ? 'text-green-600 font-medium' : ''}>
              {progress}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${progressColorClass} transition-all duration-300 rounded-full`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          {entrySheet.companyId && version != null ? (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(entrySheet.createdAt)}
              <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px] font-medium">
                v{version}
              </span>
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {relativeTime}
            </>
          )}
        </span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          {onUseAsCompanyES && (
            <button
              onClick={handleUseAsCompanyES}
              className="p-1.5 rounded hover:bg-primary-50 transition-colors text-gray-400 hover:text-primary-600"
              title="企業ESとして使う"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </button>
          )}
          <button
            onClick={handleCopyClick}
            className="p-1.5 rounded hover:bg-gray-100 transition-all text-gray-400 hover:text-gray-600"
            title="コピー"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
