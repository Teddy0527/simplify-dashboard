import { useState } from 'react';
import { JobSite, trackEventAsync } from '@jobsimplify/shared';
import { useAuth } from '../shared/hooks/useAuth';
import { useJobSites } from '../hooks/useJobSites';
import { useToast } from '../hooks/useToast';
import JobSiteList from '../components/jobSites/JobSiteList';
import JobSiteFormDrawer from '../components/jobSites/JobSiteFormDrawer';
import GmailFilterExport from '../components/jobSites/GmailFilterExport';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import LoadingSpinner from '../components/Common/LoadingSpinner';

export default function JobSitesPage() {
  const { user, loading: authLoading, signIn } = useAuth();

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">ログインが必要です</h2>
          <p className="text-sm text-gray-500">Googleアカウントでログインして、就活サイト管理を始めましょう。</p>
          <button onClick={signIn} className="btn-primary text-sm py-2 px-6">
            Googleでログイン
          </button>
        </div>
      </div>
    );
  }

  return <JobSitesContent />;
}

function JobSitesContent() {
  const { sites, loaded, addSite, updateSite, deleteSite } = useJobSites();
  const { showToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState<JobSite | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JobSite | null>(null);

  async function handleSave(site: JobSite) {
    if (editingSite) {
      const result = await updateSite(site);
      if (result.ok) {
        showToast('サイトを更新しました');
      } else {
        showToast('サイトの更新に失敗しました', 'error');
      }
    } else {
      const result = await addSite(site);
      if (result.ok) {
        showToast('サイトを追加しました');
      } else {
        showToast('サイトの追加に失敗しました', 'error');
      }
    }
    setEditingSite(null);
    setShowForm(false);
  }

  async function handleSaveWithTracking(site: JobSite) {
    trackEventAsync(editingSite ? 'job_site.update' : 'job_site.create', {
      siteId: site.id,
      name: site.name,
    });
    return handleSave(site);
  }

  async function handleMarkChecked(site: JobSite) {
    const result = await updateSite({
      ...site,
      lastCheckedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    if (result.ok) {
      showToast('確認済みにしました');
    } else {
      showToast('更新に失敗しました', 'error');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const result = await deleteSite(deleteTarget.id);
    if (result.ok) {
      showToast('サイトを削除しました');
    } else {
      showToast('削除に失敗しました', 'error');
    }
    setDeleteTarget(null);
  }

  if (!loaded) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">就活サイト管理</h1>
          <p className="text-sm text-gray-500 mt-0.5">登録サイトを一覧管理し、確認状況を把握</p>
        </div>
        <button
          onClick={() => {
            setEditingSite(null);
            setShowForm(true);
          }}
          className="btn-primary text-sm py-2 px-4"
        >
          + サイトを追加
        </button>
      </div>

      <GmailFilterExport sites={sites} />

      <JobSiteList
        sites={sites}
        onEdit={(site) => {
          setEditingSite(site);
          setShowForm(true);
        }}
        onDelete={setDeleteTarget}
        onMarkChecked={handleMarkChecked}
      />

      {showForm && (
        <JobSiteFormDrawer
          site={editingSite}
          onSave={handleSaveWithTracking}
          onClose={() => {
            setShowForm(false);
            setEditingSite(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="サイトを削除"
        message={`「${deleteTarget?.name ?? ''}」を削除しますか？この操作は取り消せません。`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
