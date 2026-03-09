import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Company, SelectionStatus, SelectionStage, createCompany, trackEventAsync } from '@jobsimplify/shared';
import { useAuth } from '../shared/hooks/useAuth';
import { useCompanies } from '../hooks/useCompanies';
import { useToast } from '../hooks/useToast';
import { useOnboardingContext } from '../contexts/OnboardingContext';
import FilterBar from '../components/FilterBar';
import type { ViewMode } from '../components/FilterBar';
import KanbanBoard from '../components/KanbanBoard';
import CalendarView from '../components/CalendarView';
import MobileTrackerView from '../components/mobile/MobileTrackerView';
import BulkActionBar from '../components/BulkActionBar';
import AddCompanyDrawer from '../components/AddCompanyModal';
import CompanyDrawer from '../components/CompanyDrawer';
import EmptyState from '../components/Common/EmptyState';
import LoadingSpinner from '../components/Common/LoadingSpinner';

export default function TrackerPage() {
  const { user, signIn } = useAuth();
  const { companies, loaded, reorder, addCompany, updateCompany, deleteCompany, deleteCompanies } = useCompanies();
  const { showToast } = useToast();
  const { completeChecklistItem } = useOnboardingContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [showAddModal, setShowAddModal] = useState(false);
  const addModalHadInput = useRef(false);
  const [drawerCompanyId, setDrawerCompanyId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleToggleSelect = useCallback((company: Company) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(company.id)) {
        next.delete(company.id);
      } else {
        next.add(company.id);
      }
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(() => {
    const count = selectedIds.size;
    if (count === 0) return;
    if (!window.confirm(`${count}件の企業を削除しますか？この操作は取り消せません。`)) return;
    deleteCompanies([...selectedIds]);
    setSelectedIds(new Set());
    showToast(`${count}件を削除しました`);
  }, [selectedIds, deleteCompanies, showToast]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

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

  const filtered = companies;

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

  function handleAddStageFromCalendar(companyId: string, stage: SelectionStage) {
    const company = companies.find((c) => c.id === companyId);
    if (!company) return;
    const updated = {
      ...company,
      stages: [...company.stages, stage],
      updatedAt: new Date().toISOString(),
    };
    updateCompany(updated);
    showToast('ステージを追加しました');
  }

  function handleCreateCompanyFromCalendar(name: string, stage: SelectionStage) {
    const company = createCompany(name);
    company.stages = [...company.stages, stage];
    addCompany(company);
    showToast(`${name}を追加しました`);
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
      <div className="flex-1 flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #f8f9fb 0%, #eef1f6 100%)' }}>
        <div className="relative max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Decorative top gradient bar */}
          <div className="h-1" style={{ background: 'linear-gradient(to right, var(--color-primary-500), var(--color-primary-800))' }} />

          {/* Decorative background elements */}
          <div className="absolute top-12 -right-8 w-32 h-32 rounded-full opacity-[0.04]" style={{ backgroundColor: 'var(--color-primary-600)' }} />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-[0.04]" style={{ backgroundColor: 'var(--color-primary-600)' }} />

          <div className="relative px-8 pt-10 pb-10 text-center">
            {/* App icon */}
            <div
              className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-sm"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary-50), var(--color-primary-100))',
                border: '1px solid var(--color-primary-100)',
              }}
            >
              <img src="/favicon.svg" alt="JobSimplify" className="w-9 h-9" />
            </div>

            {/* Title & Description */}
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-primary-900)' }}>
              就活を、シンプルに。
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              Googleアカウントでログインして、<br />
              応募管理・選考トラッキングを<br />
              始めましょう。
            </p>

            {/* Google Sign-in Button */}
            <button
              onClick={signIn}
              className="group inline-flex items-center justify-center gap-3 w-full px-6 py-3.5 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--color-primary-700)',
                color: 'white',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary-800)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary-700)')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="white" fillOpacity="0.85" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white" fillOpacity="0.85" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="white" fillOpacity="0.85" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="white" fillOpacity="0.85" />
              </svg>
              Googleでログイン
            </button>

            {/* Trust badge */}
            <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-gray-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              安全なGoogle認証を使用しています
            </div>
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
      {viewMode !== 'calendar' && (
        <FilterBar
          onAddClick={() => {
            setShowAddModal(true);
            addModalHadInput.current = false;
            trackEventAsync('interaction.add_modal_open');
          }}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      )}

      {/* View */}
      <div className={`flex-1 overflow-hidden flex ${viewMode === 'calendar' ? 'bg-white' : 'pt-4 bg-gray-50 border-t border-gray-200 shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)]'}`}>
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
        ) : viewMode === 'calendar' ? (
          <CalendarView
            companies={filtered}
            onCardClick={handleCardClick}
            onAddStage={handleAddStageFromCalendar}
            onCreateCompanyAndStage={handleCreateCompanyFromCalendar}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onAddClick={() => {
              setShowAddModal(true);
              addModalHadInput.current = false;
              trackEventAsync('interaction.add_modal_open');
            }}
          />
        ) : (
          <>
            {/* Desktop: Kanban board */}
            <div className="hidden md:block flex-1 overflow-hidden">
              <KanbanBoard
                companies={filtered}
                onReorder={(newCompanies) => {
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
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                hasSelection={selectedIds.size > 0}
              />
            </div>
            {/* Mobile: Action-priority view */}
            <div className="block md:hidden flex-1 overflow-y-auto">
              <MobileTrackerView
                companies={filtered}
                onCardClick={handleCardClick}
                onStatusChange={(company: Company, newStatus: SelectionStatus) => {
                  updateCompany({ ...company, status: newStatus, updatedAt: new Date().toISOString() });
                  showToast('ステータスを変更しました');
                }}
              />
            </div>
          </>
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

      <BulkActionBar
        count={selectedIds.size}
        onDelete={handleBulkDelete}
        onClear={handleClearSelection}
      />

      {drawerCompany && (
        <CompanyDrawer
          company={drawerCompany}
          onSave={handleDrawerSave}
          onDelete={handleDrawerDelete}
          onClose={() => setDrawerCompanyId(null)}
        />
      )}

    </>
  );
}
