import { useState, useMemo } from 'react';
import { Company, SelectionStatus, STATUS_LABELS, INDUSTRY_OPTIONS } from '@jobsimplify/shared';
import type { DraftCompany, OnFieldChange } from './types';
import { buildTimeline } from './types';
import ApplicationTimeline from './ApplicationTimeline';
import DeadlineManager from '../DeadlineManager';

interface DrawerOverviewTabProps {
  company: Company;
  draft: DraftCompany;
  onFieldChange: OnFieldChange;
}

const ALL_STATUSES: SelectionStatus[] = [
  'interested', 'es_submitted', 'webtest', 'gd',
  'interview_1', 'interview_2', 'interview_3', 'interview_final',
  'offer', 'rejected', 'declined',
];

export default function DrawerOverviewTab({ company, draft, onFieldChange }: DrawerOverviewTabProps) {
  const [showAll, setShowAll] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const timelineEntries = useMemo(
    () => buildTimeline(draft.status, draft.stages, showAll),
    [draft.status, draft.stages, showAll],
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left column */}
      <div className="flex-[3] space-y-5">
        <div>
          <label className="input-label">企業名</label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <label className="input-label">業界</label>
          <select
            value={draft.industry}
            onChange={(e) => onFieldChange('industry', e.target.value)}
            className="select-field"
          >
            <option value="">選択してください</option>
            {INDUSTRY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {company.recruitUrl && (
          <div>
            <label className="input-label">採用ページ</label>
            <a
              href={company.recruitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 hover:underline"
            >
              {company.recruitUrl}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        )}

        {/* Login info section */}
        <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 tracking-wide">ログイン情報</h3>
            <div className="space-y-4">
              <div>
                <label className="input-label">マイページURL</label>
                <input
                  type="url"
                  value={draft.loginUrl}
                  onChange={(e) => onFieldChange('loginUrl', e.target.value)}
                  className="input-field"
                  placeholder="https://..."
                  autoComplete="one-time-code"
                  data-1p-ignore
                  data-lpignore="true"
                />
              </div>
              <div>
                <label className="input-label">マイページID</label>
                <input
                  type="text"
                  value={draft.myPageId}
                  onChange={(e) => onFieldChange('myPageId', e.target.value)}
                  className="input-field"
                  placeholder="ID・メールアドレス"
                  autoComplete="one-time-code"
                  data-1p-ignore
                  data-lpignore="true"
                />
              </div>
              <div>
                <label className="input-label">マイページパスワード</label>
                <div className="relative">
                  <input
                    type="text"
                    value={draft.loginPassword}
                    onChange={(e) => onFieldChange('loginPassword', e.target.value)}
                    className="input-field pr-10"
                    placeholder="パスワード"
                    autoComplete="one-time-code"
                    data-1p-ignore
                    data-lpignore="true"
                    style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc' } as React.CSSProperties}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
        </div>

        <div>
          <label className="input-label">メモ</label>
          <textarea
            value={draft.memo}
            onChange={(e) => onFieldChange('memo', e.target.value)}
            rows={6}
            className="input-field resize-none"
            placeholder="選考に関するメモ..."
          />
        </div>

      </div>

      {/* Right column */}
      <div className="flex-[2]">
        <div className="bg-gray-50 rounded-lg p-4 space-y-5">
          <div>
            <label className="input-label">ステータス</label>
            <select
              value={draft.status}
              onChange={(e) => onFieldChange('status', e.target.value as SelectionStatus)}
              className="select-field"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <ApplicationTimeline
            entries={timelineEntries}
            stages={draft.stages}
            showAll={showAll}
            onToggleShowAll={() => setShowAll((v) => !v)}
            onStagesChange={(stages) => onFieldChange('stages', stages)}
          />

          <div className="border-t border-gray-200 mt-4 pt-4">
            <DeadlineManager
              deadlines={draft.deadlines}
              companyName={company.name}
              onDeadlinesChange={(deadlines) => onFieldChange('deadlines', deadlines)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
