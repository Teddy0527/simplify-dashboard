import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Company, INDUSTRY_OPTIONS, trackEventAsync, trackEventDebounced } from '@jobsimplify/shared';
import { useAuth } from '../shared/hooks/useAuth';
import { useCompanies } from '../hooks/useCompanies';
import { useToast } from '../hooks/useToast';
import { useOnboardingContext } from '../contexts/OnboardingContext';
import FilterBar, { ViewMode } from '../components/FilterBar';
import KanbanBoard from '../components/KanbanBoard';
import DeadlineCalendarView from '../components/DeadlineCalendarView';
import AddCompanyDrawer from '../components/AddCompanyModal';
import CompanyDrawer from '../components/CompanyDrawer';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import EmptyState from '../components/Common/EmptyState';
import LoadingSpinner from '../components/Common/LoadingSpinner';

export default function TrackerPage() {
  const { user, signIn } = useAuth();
  const { companies, loaded, reorder, addCompany, updateCompany, deleteCompany } = useCompanies();
  const { showToast } = useToast();
  const { completeChecklistItem } = useOnboardingContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  const [showAddModal, setShowAddModal] = useState(false);
  const addModalHadInput = useRef(false);
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
    trackEventAsync('interaction.drawer_open', { companyId: company.id });
  }

  function handleDrawerSave(company: Company) {
    updateCompany(company);
    setDrawerCompanyId(null);
    showToast('保存しました');
    trackEventAsync('interaction.drawer_save', { companyId: company.id });
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

  // Handle ?action=add query param to auto-open AddCompanyDrawer
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add' && user && loaded) {
      setShowAddModal(true);
      addModalHadInput.current = false;
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, user, loaded, setSearchParams]);

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Decorative top bar */}
          <div className="h-1.5" style={{ background: 'linear-gradient(to right, var(--color-primary-400), var(--color-primary-700))' }} />

          <div className="px-8 pt-8 pb-10 text-center">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-50)' }}>
              <svg className="w-8 h-8" style={{ color: 'var(--color-primary-600)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>

            {/* Title & Description */}
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              就活をもっとシンプルに
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              Googleアカウントでログインして、<br />
              応募企業の管理・選考トラッキングを始めましょう。
            </p>

            {/* Google Sign-in Button */}
            <button
              onClick={signIn}
              className="inline-flex items-center justify-center gap-3 w-full px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
              style={{ backgroundColor: 'var(--color-primary-700)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary-800)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary-700)')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="white" fillOpacity="0.8" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white" fillOpacity="0.8" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="white" fillOpacity="0.8" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="white" fillOpacity="0.8" />
              </svg>
              Googleでログイン
            </button>

            {/* Trust text */}
            <p className="mt-4 text-xs text-gray-400">
              安全なGoogle認証を使用しています
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!loaded) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q) trackEventDebounced('interaction.filter_use', { type: 'search', query: q.slice(0, 50) });
        }}
        industryFilter={industryFilter}
        onIndustryChange={(v) => {
          setIndustryFilter(v);
          if (v) trackEventAsync('interaction.filter_use', { type: 'industry', value: v });
        }}
        viewMode={viewMode}
        onViewModeChange={(v) => {
          setViewMode(v);
          trackEventAsync('interaction.view_mode_change', { from: viewMode, to: v, page: 'tracker' });
        }}
        industries={industries}
        onAddClick={() => {
          setShowAddModal(true);
          addModalHadInput.current = false;
          trackEventAsync('interaction.add_modal_open');
        }}
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
            onReorder={(newCompanies) => {
              // Detect column (status) changes for onboarding checklist
              const hasStatusChange = newCompanies.some(nc => {
                const old = companies.find(c => c.id === nc.id);
                return old && old.status !== nc.status;
              });
              if (hasStatusChange) {
                completeChecklistItem('drag_card');
              }
              reorder(newCompanies);
            }}
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
            completeChecklistItem('add_company');
          }}
          onClose={() => {
            trackEventAsync('interaction.add_modal_cancel', { hadInput: addModalHadInput.current });
            setShowAddModal(false);
          }}
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
