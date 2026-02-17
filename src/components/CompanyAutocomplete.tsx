import { useState, useRef, useEffect, useCallback } from 'react';
import { useCompanySearch } from '../hooks/useCompanySearch';
import type { CompanySearchResult } from '@jobsimplify/shared';
import { CompanyLogo } from './ui/CompanyLogo';

interface CompanyAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (company: CompanySearchResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  required?: boolean;
}

/**
 * 企業名オートコンプリートコンポーネント
 *
 * - 入力に応じて企業候補を表示
 * - フォーカス時＆未入力時に人気企業を表示
 * - ロゴ、企業名、業種を表示
 * - 選択時に企業情報を親コンポーネントに通知
 */
export function CompanyAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = '企業名を入力',
  className = '',
  disabled = false,
  autoFocus = false,
  required = false,
}: CompanyAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results, popularCompanies, loading, error, search, clearResults } = useCompanySearch({
    debounceMs: 300,
    limit: 8,
    minQueryLength: 1,
  });

  // Determine which list to show
  const showingPopular = results.length === 0 && value.length === 0 && popularCompanies.length > 0;
  const displayItems = showingPopular ? popularCompanies : results;

  // 入力変更時
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      search(newValue);
      setIsOpen(true);
      setHighlightedIndex(-1);
    },
    [onChange, search]
  );

  // 企業選択時
  const handleSelect = useCallback(
    (company: CompanySearchResult) => {
      onChange(company.name);
      onSelect?.(company);
      setIsOpen(false);
      clearResults();
      inputRef.current?.blur();
    },
    [onChange, onSelect, clearResults]
  );

  // キーボード操作
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || displayItems.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < displayItems.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : displayItems.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < displayItems.length) {
            handleSelect(displayItems[highlightedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    },
    [isOpen, displayItems, highlightedIndex, handleSelect]
  );

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // フォーカス時にドロップダウンを開く
  const handleFocus = () => {
    if (results.length > 0 || (value.length === 0 && popularCompanies.length > 0)) {
      setIsOpen(true);
    }
  };

  const showDropdown = isOpen && (displayItems.length > 0 || loading || !!error);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          required={required}
          className="input-field pr-10"
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />

        {/* ローディングインジケーター */}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* ドロップダウン */}
      {showDropdown && (
        <ul
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200
                     rounded-lg shadow-lg max-h-80 overflow-y-auto"
          role="listbox"
        >
          {error && (
            <li className="px-4 py-3 text-sm text-error-500">{error}</li>
          )}

          {loading && results.length === 0 && (
            <li className="px-4 py-3 text-sm text-gray-500">検索中...</li>
          )}

          {!loading && !error && results.length === 0 && value.length >= 1 && (
            <li className="px-4 py-3 text-sm text-gray-500">
              該当する企業が見つかりません
            </li>
          )}

          {/* 人気企業セクションヘッダー */}
          {showingPopular && (
            <li className="px-4 pt-3 pb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider select-none">
              人気の企業
            </li>
          )}

          {displayItems.map((company, index) => (
            <li
              key={company.id}
              onClick={() => handleSelect(company)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                         ${
                           highlightedIndex === index
                             ? 'bg-primary-50'
                             : 'hover:bg-gray-50'
                         }`}
              role="option"
              aria-selected={highlightedIndex === index}
            >
              {/* ロゴ */}
              <CompanyLogo
                name={company.name}
                logoUrl={company.logoUrl}
                websiteDomain={company.websiteDomain ?? company.websiteUrl}
                size="sm"
                className="w-8 h-8 rounded-md text-sm"
              />

              {/* 企業情報 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 truncate">
                    {company.name}
                  </span>
                  {company.isPopular && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 text-xs font-medium text-primary-700 bg-primary-100 rounded">
                      人気
                    </span>
                  )}
                </div>
                {company.industry && (
                  <span className="text-sm text-gray-500 truncate block">
                    {company.industry}
                  </span>
                )}
                {company.recruitUrl && (
                  <a
                    href={company.recruitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-primary-600 hover:underline truncate block"
                  >
                    採用ページ →
                  </a>
                )}
              </div>

              {/* マイページURLがある場合のインジケーター */}
              {company.mypageUrl && (
                <div
                  className="flex-shrink-0 text-success-600"
                  title="マイページURL登録済み"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
