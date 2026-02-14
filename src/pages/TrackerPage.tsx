import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Company, INDUSTRY_OPTIONS } from '@jobsimplify/shared';
import { useCompanies } from '../hooks/useCompanies';
import { useAuth } from '../shared/hooks/useAuth';
import { useToast } from '../hooks/useToast';
import FilterBar, { ViewMode } from '../components/FilterBar';
import KanbanBoard from '../components/KanbanBoard';
import DeadlineCalendarView from '../components/DeadlineCalendarView';
import AddCompanyDrawer from '../components/AddCompanyModal';
import CompanyDrawer from '../components/CompanyDrawer';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import EmptyState from '../components/Common/EmptyState';
import LoadingSpinner from '../components/Common/LoadingSpinner';

export default function TrackerPage() {
  const { user, loading: authLoading, signIn } = useAuth();

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">ログインが必要です</h2>
          <p className="text-sm text-gray-500">Googleアカウントでログインして、選考管理を始めましょう。</p>
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

  return <TrackerContent />;
}

function TrackerContent() {
  const { companies, loaded, reorder, addCompany, updateCompany, deleteCompany } = useCompanies();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  const [showAddModal, setShowAddModal] = useState(false);
  const [drawerCompanyId, setDrawerCompanyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Auto-open drawer from ?company=<id> query param
  useEffect(() => {
    const companyId = searchParams.get('company');
    if (companyId && loaded && companies.some(c => c.id === companyId)) {
      setDrawerCompanyId(companyId);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, loaded, companies, setSearchParams]);

  const drawerCompany = useMemo(
    () => drawerCompanyId ? companies.find(c => c.id === drawerCompanyId) ?? null : null,
    [companies, drawerCompanyId],
  );

  const industries = INDUSTRY_OPTIONS as unknown as string[];

  const filtered = useMemo(() => {
    let result = companies;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (industryFilter) {
      result = result.filter((c) => c.industry === industryFilter);
    }
    return result;
  }, [companies, searchQuery, industryFilter]);

  function handleCardClick(company: Company) {
    setDrawerCompanyId(company.id);
  }

  function handleDrawerSave(company: Company) {
    updateCompany(company);
    setDrawerCompanyId(null);
    showToast('保存しました');
  }

  function handleDrawerDelete(id: string) {
    deleteCompany(id);
    setDrawerCompanyId(null);
    showToast('削除しました');
  }

  function handleCardDelete(company: Company) {
    setDeleteTarget({ id: company.id, name: company.name });
  }

  function confirmCardDelete() {
    if (!deleteTarget) return;
    deleteCompany(deleteTarget.id);
    showToast('削除しました');
    setDeleteTarget(null);
  }

  if (!loaded) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        industryFilter={industryFilter}
        onIndustryChange={setIndustryFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        industries={industries}
        onAddClick={() => setShowAddModal(true)}
        companies={companies}
        onCompanyClick={handleCardClick}
      />

      {/* View */}
      <div className={`flex-1 overflow-hidden flex ${
        viewMode === 'calendar'
          ? 'bg-white'
          : 'pt-4 bg-gray-50 border-t border-gray-200 shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)]'
      }`}>
        {companies.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            title="まだ企業が登録されていません"
            description="「+ 応募を追加」から企業を追加して、選考管理を始めましょう。"
            action={
              <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm py-2 px-4">
                + 応募を追加
              </button>
            }
          />
        ) : viewMode === 'kanban' ? (
          <KanbanBoard
            companies={filtered}
            onReorder={reorder}
            onCardClick={handleCardClick}
            onCardDelete={handleCardDelete}
          />
        ) : (
          <DeadlineCalendarView
            companies={filtered}
            onCardClick={handleCardClick}
          />
        )}
      </div>

      {showAddModal && (
        <AddCompanyDrawer
          onSave={(company) => {
            addCompany(company);
            setShowAddModal(false);
            setDrawerCompanyId(company.id);
            showToast('企業を追加しました');
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {drawerCompany && (
        <CompanyDrawer
          company={drawerCompany}
          onSave={handleDrawerSave}
          onDelete={handleDrawerDelete}
          onClose={() => setDrawerCompanyId(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="企業を削除"
        message={`「${deleteTarget?.name ?? ''}」を削除しますか？この操作は取り消せません。`}
        onConfirm={confirmCardDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
