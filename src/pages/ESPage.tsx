import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EntrySheet, Company, createEntrySheet } from '@jobsimplify/shared';
import { useEntrySheetContext } from '../contexts/EntrySheetContext';
import { useCompanies } from '../hooks/useCompanies';
import { useAuth } from '../shared/hooks/useAuth';
import { useToast } from '../hooks/useToast';
import ESFileManagerSidebar, { type SelectedCategory } from '../components/ES/ESFileManagerSidebar';
import ESFileManagerContent from '../components/ES/ESFileManagerContent';
import ESDrawer from '../components/ES/ESDrawer';
import ESCopyModal from '../components/ES/ESCopyModal';
import TemplateCreateModal from '../components/ES/TemplateCreateModal';
import AddCompanyDrawer from '../components/AddCompanyModal';
import LoadingSpinner from '../components/Common/LoadingSpinner';

export default function ESPage() {
  const { user, loading: authLoading, signIn } = useAuth();

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">ログインが必要です</h2>
          <p className="text-sm text-gray-500">Googleアカウントでログインして、ES管理を始めましょう。</p>
          <button
            onClick={signIn}
            className="btn-primary text-sm py-2 px-6"
          >
            Googleでログイン
          </button>
        </div>
      </div>
    );
  }

  return <ESContent />;
}

function ESContent() {
  const { entrySheets, loading, add, update, remove, addQuestion, updateQuestion, removeQuestion } = useEntrySheetContext();
  const { companies, addCompany } = useCompanies();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine initial selected category from URL params
  const initialCategory = useMemo((): SelectedCategory => {
    const companyId = searchParams.get('company');
    if (companyId) {
      const company = companies.find(c => c.id === companyId);
      const companyES = entrySheets.find(es => es.companyId === companyId);
      const companyName = company?.name || companyES?.companyName || '';
      if (companyName) {
        return { type: 'company', companyId, companyName };
      }
    }
    return { type: 'template' };
  }, []);

  const [selected, setSelected] = useState<SelectedCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerEntrySheet, setDrawerEntrySheet] = useState<EntrySheet | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copySource, setCopySource] = useState<EntrySheet | null>(null);
  const [copyRequireCompany, setCopyRequireCompany] = useState(false);
  const [showTemplateCreateModal, setShowTemplateCreateModal] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);

  // Update selected category when URL params change (deep link from kanban)
  useEffect(() => {
    const companyId = searchParams.get('company');
    if (companyId) {
      const company = companies.find(c => c.id === companyId);
      const companyES = entrySheets.find(es => es.companyId === companyId);
      const companyName = company?.name || companyES?.companyName || '';
      if (companyName) {
        setSelected({ type: 'company', companyId, companyName });
      }
    }
  }, [searchParams, companies, entrySheets]);

  // Handle ?action=create to auto-open create drawer (from CompanyDrawer)
  useEffect(() => {
    if (searchParams.get('action') === 'create' && !loading) {
      handleCreate();
      // Remove action param from URL without triggering re-render
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams, { replace: true });
    }
  }, [loading]);

  const handleSelectCategory = useCallback((category: SelectedCategory) => {
    setSelected(category);
    if (category.type === 'company') {
      setSearchParams({ company: category.companyId });
    } else {
      setSearchParams({});
    }
  }, [setSearchParams]);

  const handleCreate = () => {
    const newES = createEntrySheet('新規ES');
    if (selected.type === 'company') {
      newES.companyId = selected.companyId;
      newES.companyName = selected.companyName;
    }
    setDrawerEntrySheet(newES);
    setIsCreating(true);
  };

  const handleCreateTemplate = async (title: string) => {
    const newES = createEntrySheet(title);
    setShowTemplateCreateModal(false);
    setDrawerEntrySheet(newES);
    setIsCreating(true);
    handleSelectCategory({ type: 'template' });
  };

  const handleAddCompanySave = async (company: Company) => {
    await addCompany(company);
    showToast(`${company.name}を追加しました`);
    setShowAddCompany(false);
  };

  const handleSave = async (entrySheet: EntrySheet) => {
    try {
      if (isCreating) {
        await add(entrySheet);
        showToast('ESを作成しました');
      } else {
        await update(entrySheet);
        showToast('ESを保存しました');
      }
      setDrawerEntrySheet(null);
      setIsCreating(false);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'エラーが発生しました');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      setDrawerEntrySheet(null);
      setIsCreating(false);
      showToast('ESを削除しました');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'エラーが発生しました');
    }
  };

  const handleClose = () => {
    setDrawerEntrySheet(null);
    setIsCreating(false);
  };

  const handleCopy = (entrySheet: EntrySheet) => {
    setCopySource(entrySheet);
    setCopyRequireCompany(false);
  };

  const handleUseAsCompanyES = (entrySheet: EntrySheet) => {
    setCopySource(entrySheet);
    setCopyRequireCompany(true);
  };

  const handleCopyConfirm = async (newTitle: string, newCompanyId?: string, newCompanyName?: string) => {
    if (!copySource) return;

    try {
      const newId = crypto.randomUUID();
      const copiedES: EntrySheet = {
        ...copySource,
        id: newId,
        title: newTitle,
        companyId: newCompanyId,
        companyName: newCompanyName,
        questions: copySource.questions.map(q => ({
          ...q,
          id: crypto.randomUUID(),
          entrySheetId: newId,
        })),
        freeformContent: copySource.freeformContent,
        externalLinks: copySource.externalLinks?.map(l => ({ ...l, id: crypto.randomUUID() })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await add(copiedES);
      showToast('ESをコピーしました');
      setCopySource(null);
      setCopyRequireCompany(false);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'コピーに失敗しました');
    }
  };

  const handleSaveAsTemplate = async (entrySheet: EntrySheet) => {
    try {
      const newId = crypto.randomUUID();
      const templateES: EntrySheet = {
        ...entrySheet,
        id: newId,
        companyId: undefined,
        companyName: undefined,
        title: `${entrySheet.title}（テンプレート）`,
        questions: entrySheet.questions.map(q => ({
          ...q,
          id: crypto.randomUUID(),
          entrySheetId: newId,
        })),
        freeformContent: entrySheet.freeformContent,
        externalLinks: entrySheet.externalLinks?.map(l => ({ ...l, id: crypto.randomUUID() })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await add(templateES);
      showToast('テンプレートとして保存しました');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'テンプレート保存に失敗しました');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const genericEntrySheets = entrySheets.filter(es => !es.companyId);
  const viewMode = selected.type === 'template' ? 'generic' as const : 'company' as const;

  return (
    <>
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">ES管理</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreate}
              className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新規ES
            </button>
            <button
              onClick={() => setShowTemplateCreateModal(true)}
              className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              テンプレート作成
            </button>
          </div>
        </div>
      </div>

      {/* File Manager Layout */}
      <div className="flex-1 overflow-hidden flex bg-gray-50">
        <ESFileManagerSidebar
          entrySheets={entrySheets}
          companies={companies}
          selected={selected}
          onSelect={handleSelectCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddCompany={() => setShowAddCompany(true)}
        />
        <ESFileManagerContent
          entrySheets={entrySheets}
          selected={selected}
          searchQuery={searchQuery}
          onCardClick={setDrawerEntrySheet}
          onCopy={handleCopy}
          onUseAsCompanyES={selected.type === 'template' ? handleUseAsCompanyES : undefined}
          onCreateNew={handleCreate}
          onCreateTemplate={() => setShowTemplateCreateModal(true)}
        />
      </div>

      {/* Drawer */}
      {drawerEntrySheet && (
        <ESDrawer
          entrySheet={drawerEntrySheet}
          isNew={isCreating}
          viewMode={viewMode}
          templates={genericEntrySheets}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={handleClose}
          onAddQuestion={addQuestion}
          onUpdateQuestion={updateQuestion}
          onRemoveQuestion={removeQuestion}
          onSaveAsTemplate={drawerEntrySheet.companyId ? handleSaveAsTemplate : undefined}
        />
      )}

      {/* Copy Modal */}
      {copySource && (
        <ESCopyModal
          sourceES={copySource}
          requireCompany={copyRequireCompany}
          onConfirm={handleCopyConfirm}
          onClose={() => { setCopySource(null); setCopyRequireCompany(false); }}
        />
      )}

      {/* Template Create Modal */}
      {showTemplateCreateModal && (
        <TemplateCreateModal
          onConfirm={handleCreateTemplate}
          onClose={() => setShowTemplateCreateModal(false)}
        />
      )}

      {/* Add Company Drawer */}
      {showAddCompany && (
        <AddCompanyDrawer
          onSave={handleAddCompanySave}
          onClose={() => setShowAddCompany(false)}
        />
      )}
    </>
  );
}
