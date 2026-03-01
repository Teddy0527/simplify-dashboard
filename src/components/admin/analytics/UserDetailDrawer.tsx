import { useState, useEffect } from 'react';
import type { UserActivitySummary, UserLoginHistory, UserCompanyDetail } from '@jobsimplify/shared';
import { getUserLoginHistory, getUserCompanies } from '@jobsimplify/shared';
import { CompanyLogo } from '../../ui/CompanyLogo';

interface UserDetailDrawerProps {
  user: UserActivitySummary;
  onClose: () => void;
}

type Tab = 'login' | 'companies';

export default function UserDetailDrawer({ user, onClose }: UserDetailDrawerProps) {
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [loginHistory, setLoginHistory] = useState<UserLoginHistory[]>([]);
  const [companies, setCompanies] = useState<UserCompanyDetail[]>([]);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

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

  // Fetch data on mount
  useEffect(() => {
    setLoadingLogin(true);
    getUserLoginHistory(user.userId).then((data) => {
      setLoginHistory(data);
      setLoadingLogin(false);
    });
    setLoadingCompanies(true);
    getUserCompanies(user.userId).then((data) => {
      setCompanies(data);
      setLoadingCompanies(false);
    });
  }, [user.userId]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 250);
  }

  const tabClass = (tab: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      activeTab === tab
        ? 'border-primary-600 text-primary-600'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-250 ${visible ? 'opacity-30' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Drawer panel */}
      <div
        className={`relative w-full lg:w-2/3 max-w-2xl bg-white shadow-xl flex flex-col transition-transform duration-250 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg text-gray-500 font-medium flex-shrink-0">
                {(user.fullName ?? user.email).charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {user.fullName && (
                <h2 className="text-lg font-semibold text-gray-900 truncate">{user.fullName}</h2>
              )}
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-lg transition-colors flex-shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Info badges */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              登録: {user.createdAt?.slice(0, 10)}
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              最終活動: {user.lastActiveAt?.slice(0, 10) ?? '-'}
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
              企業 {user.companyCount}
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-medium">
              イベント {user.totalEvents}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white px-6">
          <button className={tabClass('login')} onClick={() => setActiveTab('login')}>
            ログイン履歴
          </button>
          <button className={tabClass('companies')} onClick={() => setActiveTab('companies')}>
            登録企業
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {activeTab === 'login' ? (
            <LoginHistoryTab history={loginHistory} loading={loadingLogin} />
          ) : (
            <CompaniesTab companies={companies} loading={loadingCompanies} />
          )}
        </div>
      </div>
    </div>
  );
}

function LoginHistoryTab({ history, loading }: { history: UserLoginHistory[]; loading: boolean }) {
  if (loading) return <Spinner />;
  if (history.length === 0) return <EmptyState text="ログイン履歴がありません" />;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs text-gray-400 border-b border-gray-100">
          <th className="text-left pb-2 font-medium">#</th>
          <th className="text-left pb-2 font-medium">日時</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {history.map((h, i) => (
          <tr key={h.eventId} className="text-gray-600">
            <td className="py-2 tabular-nums text-gray-400 w-10">{i + 1}</td>
            <td className="py-2 tabular-nums">{formatDateTime(h.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CompaniesTab({ companies, loading }: { companies: UserCompanyDetail[]; loading: boolean }) {
  if (loading) return <Spinner />;
  if (companies.length === 0) return <EmptyState text="登録企業がありません" />;

  return (
    <div className="space-y-3">
      {companies.map((c) => (
        <div key={c.companyId} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
          <CompanyLogo
            name={c.companyName}
            logoUrl={c.logoUrl}
            websiteDomain={c.websiteDomain}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{c.companyName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {c.industry && (
                <span className="text-xs text-gray-500">{c.industry}</span>
              )}
              {c.applicationUpdatedAt && (
                <span className="text-xs text-gray-400">更新: {c.applicationUpdatedAt.slice(0, 10)}</span>
              )}
            </div>
          </div>
          {c.status && <StatusBadge status={c.status} />}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    interested: 'bg-blue-50 text-blue-700',
    applied: 'bg-yellow-50 text-yellow-700',
    interview: 'bg-purple-50 text-purple-700',
    offered: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-600',
    withdrawn: 'bg-gray-100 text-gray-500',
  };
  const color = colorMap[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${color}`}>
      {status}
    </span>
  );
}

function Spinner() {
  return (
    <div className="text-center py-8">
      <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-center py-8 text-sm text-gray-400">{text}</p>
  );
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
