import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import type { UserActivitySummary, UserCompanyDetail, UserDailyActivity } from '@jobsimplify/shared';
import { getUserDailyActivity, getUserCompanies } from '@jobsimplify/shared';
import { CompanyLogo } from '../../ui/CompanyLogo';
import { CHART_TOOLTIP_STYLE } from './shared';

interface UserDetailDrawerProps {
  user: UserActivitySummary;
  onClose: () => void;
}

export default function UserDetailDrawer({ user, onClose }: UserDetailDrawerProps) {
  const [visible, setVisible] = useState(false);
  const [dailyActivity, setDailyActivity] = useState<UserDailyActivity[]>([]);
  const [companies, setCompanies] = useState<UserCompanyDetail[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Fetch data in parallel
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getUserDailyActivity(user.userId),
      getUserCompanies(user.userId),
    ]).then(([daily, comps]) => {
      setDailyActivity(daily);
      setCompanies(comps);
      setLoading(false);
    });
  }, [user.userId]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 250);
  }

  // Derived stats from daily activity
  const activityStats = useMemo(() => {
    const activeDays = dailyActivity.filter((d) => d.eventCount > 0).length;
    const loginDays = dailyActivity.filter((d) => d.loginCount > 0).length;
    const totalDays = dailyActivity.length;
    const totalEvents = dailyActivity.reduce((s, d) => s + d.eventCount, 0);
    return { activeDays, loginDays, totalDays, totalEvents };
  }, [dailyActivity]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-250 ${visible ? 'opacity-30' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Drawer panel */}
      <div
        className={`relative w-full lg:w-3/4 max-w-4xl bg-white shadow-xl flex flex-col transition-transform duration-250 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
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
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {loading ? (
            <Spinner />
          ) : (
            <>
              {/* Summary cards */}
              <SummaryCards user={user} stats={activityStats} companyCount={companies.length} />

              {/* Daily activity bar chart */}
              <DailyActivityChart data={dailyActivity} />

              {/* Registered companies */}
              <CompaniesSection companies={companies} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Summary Cards ───────────────────────────────────────────────────

function SummaryCards({
  user,
  stats,
  companyCount,
}: {
  user: UserActivitySummary;
  stats: { activeDays: number; loginDays: number; totalDays: number; totalEvents: number };
  companyCount: number;
}) {
  const returnRate = stats.totalDays > 0
    ? Math.round((stats.activeDays / stats.totalDays) * 100)
    : 0;

  const cards = [
    { label: '登録日', value: user.createdAt?.slice(0, 10) ?? '-', color: 'bg-gray-50' },
    { label: '最終活動', value: user.lastActiveAt?.slice(0, 10) ?? '-', color: 'bg-gray-50' },
    { label: '活動日数', value: `${stats.activeDays} / ${stats.totalDays}日`, color: 'bg-blue-50' },
    { label: '復帰率', value: `${returnRate}%`, color: 'bg-green-50' },
    { label: '企業数', value: String(companyCount), color: 'bg-purple-50' },
    { label: 'ES数', value: String(user.esCount), color: 'bg-indigo-50' },
    { label: '総イベント', value: stats.totalEvents.toLocaleString(), color: 'bg-orange-50' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((c) => (
        <div key={c.label} className={`${c.color} rounded-xl px-3 py-3 text-center`}>
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">{c.label}</p>
          <p className="text-sm font-bold text-gray-900 tabular-nums">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Daily Activity Chart ────────────────────────────────────────────

function DailyActivityChart({ data }: { data: UserDailyActivity[] }) {
  if (data.length === 0) return null;

  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">日別アクティビティ</h3>
      <div className="admin-card p-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barCategoryGap={1}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="activityDate"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              interval={Math.max(0, Math.floor(data.length / 15))}
            />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} width={32} />
            <Tooltip
              {...CHART_TOOLTIP_STYLE}
              labelFormatter={(v) => String(v)}
              formatter={(value, name) => [
                value ?? 0,
                name === 'eventCount' ? 'イベント数' : 'ログイン数',
              ]}
            />
            <Bar dataKey="eventCount" radius={[2, 2, 0, 0]} maxBarSize={12}>
              {data.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.loginCount > 0 ? '#3b82f6' : '#d1d5db'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-blue-500" />
            ログインあり
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-gray-300" />
            ログインなし
          </span>
        </div>
      </div>
    </section>
  );
}

// ── Companies Section ───────────────────────────────────────────────

function CompaniesSection({ companies }: { companies: UserCompanyDetail[] }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        登録企業 <span className="text-gray-400 font-normal">({companies.length})</span>
      </h3>
      {companies.length === 0 ? (
        <EmptyState text="登録企業がありません" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      )}
    </section>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

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
    <div className="text-center py-12">
      <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-center py-8 text-sm text-gray-400">{text}</p>
  );
}
