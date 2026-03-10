import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Company,
  SelectionStage,
  SelectionStatus,
  STATUS_LABELS,
  STAGE_PRESETS,
} from '@jobsimplify/shared';
import { CompanyLogo } from '../ui/CompanyLogo';
import TimeDropdown from '../ui/TimeDropdown';

interface CalendarAddPopoverProps {
  dateStr: string;
  anchorRect: DOMRect;
  companies: Company[];
  onAddStage: (companyId: string, stage: SelectionStage) => void;
  onCreateCompanyAndStage: (companyName: string, stage: SelectionStage) => void;
  onClose: () => void;
  initialTime?: string;
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

const POPOVER_STAGE_PRESETS = [...STAGE_PRESETS, { value: 'other' as SelectionStatus, label: 'その他' }];

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAY_LABELS[d.getDay()]}）に追加`;
}

export default function CalendarAddPopover({
  dateStr,
  anchorRect,
  companies,
  onAddStage,
  onCreateCompanyAndStage,
  onClose,
  initialTime,
}: CalendarAddPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [companyQuery, setCompanyQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState('');
  const [selectedStageType, setSelectedStageType] = useState<SelectionStatus | null>(null);
  const [customLabel, setCustomLabel] = useState('');
  const [time, setTime] = useState(initialTime ?? '');
  const [showDropdown, setShowDropdown] = useState(false);

  // Deduplicate by company name (keep first occurrence)
  const uniqueByName = (list: Company[]) => {
    const seen = new Set<string>();
    return list.filter((c) => {
      const key = c.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // Shuffled + deduplicated list for initial display (recalculated when companies change)
  const shuffledCompanies = useMemo(() => {
    const unique = uniqueByName(companies);
    // Fisher-Yates shuffle
    const arr = [...unique];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [companies]);

  // Filter companies by query
  const filteredCompanies = companyQuery.trim()
    ? uniqueByName(
        companies.filter((c) => c.name.toLowerCase().includes(companyQuery.toLowerCase()))
      ).slice(0, 8)
    : shuffledCompanies.slice(0, 5);

  const isNewCompany = companyQuery.trim().length > 0 && !selectedCompanyId;
  const canSubmit =
    (selectedCompanyId || companyQuery.trim()) &&
    selectedStageType &&
    (selectedStageType !== 'other' || customLabel.trim());

  // Outside click
  useEffect(() => {
    const timer = setTimeout(() => {
      function handleClick(e: MouseEvent) {
        if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
          onClose();
        }
      }
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, 50);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSelectCompany = useCallback((company: Company) => {
    setSelectedCompanyId(company.id);
    setSelectedCompanyName(company.name);
    setCompanyQuery(company.name);
    setShowDropdown(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyQuery(e.target.value);
    setSelectedCompanyId(null);
    setSelectedCompanyName('');
    setShowDropdown(true);
  }, []);

  function handleSubmit() {
    if (!selectedStageType) return;
    const stage: SelectionStage = {
      type: selectedStageType,
      date: dateStr,
      time: time || undefined,
      result: 'pending',
      customLabel: selectedStageType === 'other' ? customLabel.trim() : undefined,
    };

    if (selectedCompanyId) {
      onAddStage(selectedCompanyId, stage);
    } else if (companyQuery.trim()) {
      onCreateCompanyAndStage(companyQuery.trim(), stage);
    }
    onClose();
  }

  // Position: try below anchor, fall back to above
  const isMobile = window.innerWidth <= 640;
  let style: React.CSSProperties;

  if (isMobile) {
    style = {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: '85vh',
      borderRadius: '16px 16px 0 0',
      zIndex: 100,
    };
  } else {
    const top = anchorRect.bottom + 4;
    const fitsBelow = top + 420 < window.innerHeight;
    const computedTop = fitsBelow ? top : anchorRect.top - 420;
    const left = Math.min(Math.max(anchorRect.left, 8), window.innerWidth - 376);
    style = {
      position: 'fixed',
      top: Math.max(8, computedTop),
      left,
      zIndex: 100,
    };
  }

  const previewLabel = selectedStageType === 'other'
    ? customLabel.trim() || 'その他'
    : selectedStageType ? STATUS_LABELS[selectedStageType] : '';

  const content = (
    <div ref={popoverRef} className="gcal-add-popover" style={style}>
      {/* Mobile overlay */}
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/30 -z-10"
          onClick={onClose}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">
          {formatDateHeader(dateStr)}
        </h3>
        <button
          onClick={onClose}
          className="gcal-popover-close"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Company search */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">企業</label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={companyQuery}
              onChange={handleInputChange}
              onFocus={() => setShowDropdown(true)}
              placeholder="企業名を検索..."
              className="input-field text-sm"
              autoComplete="off"
            />
            {showDropdown && filteredCompanies.length > 0 && !selectedCompanyId && (
              <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredCompanies.map((c) => (
                  <li
                    key={c.id}
                    onClick={() => handleSelectCompany(c)}
                    className="px-3 py-2 text-sm text-gray-800 hover:bg-primary-50 cursor-pointer flex items-center gap-2"
                  >
                    <CompanyLogo
                      name={c.name}
                      logoUrl={c.logoUrl}
                      websiteDomain={c.websiteDomain}
                      size="sm"
                    />
                    <span className="truncate">{c.name}</span>
                    {c.industry && (
                      <span className="text-xs text-gray-400 flex-shrink-0">{c.industry}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {isNewCompany && companyQuery.trim().length >= 1 && !showDropdown && (
              <div className="mt-1 text-xs text-primary-600">
                新しい企業として追加されます
              </div>
            )}
          </div>
        </div>

        {/* Stage type pills */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">ステージ</label>
          <div className="flex flex-wrap gap-1.5">
            {POPOVER_STAGE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setSelectedStageType(
                  selectedStageType === preset.value ? null : preset.value,
                )}
                className={`gcal-stage-pill ${
                  selectedStageType === preset.value ? 'gcal-stage-pill-selected' : ''
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {selectedStageType === 'other' && (
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="ステージ名を入力..."
              className="input-field text-sm mt-2"
              autoComplete="off"
            />
          )}
        </div>

        {/* Time input */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            時刻
            <span className="text-gray-400 font-normal ml-1">（任意）</span>
          </label>
          <TimeDropdown
            timeValue={time || undefined}
            onTimeChange={(t) => setTime(t)}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="btn-primary w-full text-sm py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          追加
        </button>

        {/* Preview */}
        {canSubmit && (
          <div className="text-xs text-gray-400 text-center">
            {selectedCompanyId ? selectedCompanyName : companyQuery.trim()} — {previewLabel}
            {time && ` ${time}`}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
