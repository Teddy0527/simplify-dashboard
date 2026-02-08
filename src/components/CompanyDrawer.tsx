import { useState, useEffect, useMemo } from 'react';
import { Company } from '@simplify/shared';
import ConfirmDialog from './Common/ConfirmDialog';
import { CompanyLogo } from './ui/CompanyLogo';
import { useEntrySheetContext } from '../contexts/EntrySheetContext';
import type { DraftCompany, OnFieldChange, DrawerTab } from './drawer/types';
import DrawerTabNav from './drawer/DrawerTabNav';
import DrawerOverviewTab from './drawer/DrawerOverviewTab';
import DrawerDocumentsTab from './drawer/DrawerDocumentsTab';

interface CompanyDrawerProps {
  company: Company;
  onSave: (company: Company) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function CompanyDrawer({ company, onSave, onDelete, onClose }: CompanyDrawerProps) {
  const { entrySheets } = useEntrySheetContext();
  const [activeTab, setActiveTab] = useState<DrawerTab>('overview');
  const [visible, setVisible] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [draft, setDraft] = useState<DraftCompany>(() => ({
    name: company.name,
    status: company.status,
    industry: company.industry || '',
    memo: company.memo || '',
    loginUrl: company.loginUrl || '',
    myPageId: company.myPageId || '',
    loginPassword: company.loginPassword || '',
    stages: company.stages ?? [],
    deadlines: company.deadlines ?? [],
  }));

  const onFieldChange: OnFieldChange = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const esCount = useMemo(
    () => entrySheets.filter((es) => es.companyId === company.id).length,
    [entrySheets, company.id],
  );

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 250);
  }

  function handleSave() {
    if (!draft.name.trim()) return;
    onSave({
      ...company,
      name: draft.name.trim(),
      status: draft.status,
      memo: draft.memo.trim() || undefined,
      loginUrl: draft.loginUrl.trim() || undefined,
      myPageId: draft.myPageId.trim() || undefined,
      loginPassword: draft.loginPassword.trim() || undefined,
      websiteDomain: company.websiteDomain,
      industry: draft.industry || undefined,
      stages: draft.stages,
      deadlines: draft.deadlines,
      updatedAt: new Date().toISOString(),
    });
    handleClose();
  }

  function handleDelete() {
    setShowConfirm(true);
  }

  function confirmDelete() {
    setShowConfirm(false);
    onDelete(company.id);
    handleClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-250 ${visible ? 'opacity-30' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Drawer panel */}
      <div
        className={`relative w-full lg:w-2/3 bg-white shadow-xl flex flex-col transition-transform duration-250 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-4">
          <CompanyLogo
            name={company.name}
            logoUrl={company.logoUrl}
            websiteDomain={company.websiteDomain}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {company.name}
              </h2>
              {company.industry && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex-shrink-0">
                  {company.industry}
                </span>
              )}
            </div>
            {company.recruitUrl && (
              <a
                href={company.recruitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
              >
                採用ページ
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              className="w-8 h-8 flex items-center justify-center hover:bg-error-50 rounded-lg transition-colors text-gray-400 hover:text-error-500"
              title="削除"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-lg transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <DrawerTabNav activeTab={activeTab} onTabChange={setActiveTab} esCount={esCount} />

        {/* Tab content */}
        <div
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="flex-1 overflow-y-auto custom-scrollbar p-6"
        >
          {activeTab === 'overview' && (
            <DrawerOverviewTab
              company={company}
              draft={draft}
              onFieldChange={onFieldChange}
            />
          )}
          {activeTab === 'documents' && (
            <DrawerDocumentsTab
              companyId={company.id}
              companyName={company.name}
            />
          )}
        </div>

        {/* Footer - hide on documents tab */}
        {activeTab !== 'documents' && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-end gap-2">
            <button onClick={handleClose} className="btn-secondary">キャンセル</button>
            <button onClick={handleSave} className="btn-primary">保存</button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="企業を削除"
        message={`「${company.name}」を削除しますか？この操作は取り消せません。`}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
