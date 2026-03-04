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
    setTimeout(onClose, 200);
  }

  const activityStats = useMemo(() => {
    const activeDays = dailyActivity.filter((d) => d.eventCount > 0).length;
    const loginDays = dailyActivity.filter((d) => d.loginCount > 0).length;
    const totalDays = dailyActivity.length;
    const totalEvents = dailyActivity.reduce((s, d) => s + d.eventCount, 0);
    return { activeDays, loginDays, totalDays, totalEvents };
  }, [dailyActivity]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-50 flex flex-col transition-all duration-200 ease-out ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'
      }`}
    >
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg px-2.5 py-1.5 transition-colors duration-150 cursor-pointer flex-shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              戻る
            </button>

            <div className="w-px h-8 bg-gray-200" />

            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-500 font-medium flex-shrink-0">
                {(user.fullName ?? user.email).charAt(0)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                {user.fullName && (
                  <h2 className="text-lg font-semibold text-slate-900">{user.fullName}</h2>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {user.university && (
                    <span className="bg-blue-50 text-blue-700 rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {user.university}
                    </span>
                  )}
                  {user.graduationYear && (
                    <span className="bg-blue-50 text-blue-700 rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {user.graduationYear % 100}卒
                    </span>
                  )}
                  {user.grade && (
                    <span className="bg-blue-50 text-blue-700 rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {user.grade}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 space-y-6">
          {loading ? (
            <Spinner />
          ) : (
            <>
              <SummaryCards user={user} stats={activityStats} companyCount={companies.length} />
              <FeatureUsageSummary companies={companies} />
              <DailyActivityChart data={dailyActivity} />
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
    { label: '登録日', value: user.createdAt?.slice(0, 10) ?? '-' },
    { label: '最終活動', value: user.lastActiveAt?.slice(0, 10) ?? '-' },
    { label: '活動日数', value: `${stats.activeDays} / ${stats.totalDays}日` },
    { label: '復帰率', value: `${returnRate}%` },
    { label: '企業数', value: String(companyCount) },
    { label: 'ES数', value: String(user.esCount) },
    { label: '総イベント', value: stats.totalEvents.toLocaleString() },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">{c.label}</p>
          <p className="text-sm font-bold text-slate-900 tabular-nums">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Feature Usage Summary ───────────────────────────────────────────

function FeatureUsageSummary({ companies }: { companies: UserCompanyDetail[] }) {
  const total = companies.length;
  if (total === 0) return null;

  const features = [
    { label: 'マイページURL', count: companies.filter((c) => !!c.loginUrl).length },
    { label: 'マイページID', count: companies.filter((c) => !!c.myPageId).length },
    { label: 'パスワード', count: companies.filter((c) => c.hasLoginPassword).length },
    { label: 'メモ', count: companies.filter((c) => !!c.memo).length },
    { label: '締切', count: companies.filter((c) => hasDeadlines(c.deadlines)).length },
    { label: '選考ステージ', count: companies.filter((c) => hasStages(c.stages)).length },
  ];

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">機能利用状況</h3>
      <div className="space-y-3">
        {features.map((f) => {
          const pct = Math.round((f.count / total) * 100);
          const barColor = pct >= 70 ? 'bg-blue-500' : pct >= 30 ? 'bg-amber-500' : 'bg-red-400';
          return (
            <div key={f.label} className="flex items-center gap-3">
              <span className="w-28 text-sm font-medium text-slate-700 flex-shrink-0">{f.label}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-sm text-slate-600 tabular-nums w-24 text-right flex-shrink-0">
                {f.count}/{total} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Daily Activity Chart ────────────────────────────────────────────

function DailyActivityChart({ data }: { data: UserDailyActivity[] }) {
  if (data.length === 0) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-900 mb-3">日別アクティビティ</h3>
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
    </section>
  );
}

// ── Companies Section ───────────────────────────────────────────────

function CompaniesSection({ companies }: { companies: UserCompanyDetail[] }) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-slate-900 mb-3">
        登録企業 <span className="text-gray-400 font-normal">({companies.length})</span>
      </h3>
      {companies.length === 0 ? (
        <EmptyState text="登録企業がありません" />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {companies.map((c) => (
            <CompanyCard key={c.companyId} company={c} />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Company Card ─────────────────────────────────────────────────────

function CompanyCard({ company: c }: { company: UserCompanyDetail }) {
  const [expanded, setExpanded] = useState(false);

  const indicators = [
    { icon: IconLink, label: 'URL', filled: !!c.loginUrl },
    { icon: IconUser, label: 'ID', filled: !!c.myPageId },
    { icon: IconKey, label: 'PW', filled: c.hasLoginPassword },
    { icon: IconFileText, label: 'メモ', filled: !!c.memo },
    { icon: IconCalendar, label: '締切', filled: hasDeadlines(c.deadlines) },
    { icon: IconGitBranch, label: 'ステージ', filled: hasStages(c.stages) },
  ];

  const stages = parseStages(c.stages);
  const deadlines = parseDeadlines(c.deadlines);

  return (
    <div className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors duration-150">
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Top row: logo + name + status */}
        <div className="flex items-center gap-3 mb-3">
          <CompanyLogo
            name={c.companyName}
            logoUrl={c.logoUrl}
            websiteDomain={c.websiteDomain}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{c.companyName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {c.industry && <span className="text-xs text-slate-500">{c.industry}</span>}
            </div>
          </div>
          {c.status && <StatusBadge status={c.status} />}
        </div>

        {/* Indicator icons row */}
        <div className="flex items-center gap-4 mb-2">
          {indicators.map((ind) => (
            <div key={ind.label} className="flex flex-col items-center gap-1">
              <ind.icon className={`w-4 h-4 ${ind.filled ? 'text-slate-600' : 'text-gray-300'}`} />
              <div className={`w-2 h-2 rounded-full ${ind.filled ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-[10px] text-gray-500">{ind.label}</span>
            </div>
          ))}
        </div>

        {/* Expand toggle */}
        <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer">
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          {expanded ? '詳細を閉じる' : '詳細を表示'}
        </button>
      </div>

      {/* Expandable detail area */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${
          expanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-3">
          {/* Memo */}
          {c.memo && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">メモ</p>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 leading-relaxed line-clamp-3">
                {c.memo}
              </div>
            </div>
          )}

          {/* Stage timeline */}
          {stages.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">選考タイムライン</p>
              <StageTimeline stages={stages} currentStatus={c.status} />
            </div>
          )}

          {/* Deadlines */}
          {deadlines.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">締切</p>
              <ul className="space-y-1">
                {deadlines.map((dl, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                    <span>{dl.label}</span>
                    <span className="text-slate-500">—</span>
                    <span className="tabular-nums">{dl.date}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Stage Timeline ───────────────────────────────────────────────────

const STAGE_ORDER = ['es', 'webtest', 'first', 'second', 'final'];
const STAGE_LABELS: Record<string, string> = {
  es: 'ES',
  webtest: 'Webテスト',
  first: '1次',
  second: '2次',
  final: '最終',
};

interface ParsedStage {
  key: string;
  label: string;
  state: 'passed' | 'current' | 'pending' | 'future' | 'failed';
}

function StageTimeline({ stages }: { stages: ParsedStage[]; currentStatus?: string }) {
  if (stages.length === 0) return null;

  const dotColor: Record<string, string> = {
    passed: 'bg-green-500',
    current: 'bg-green-500 ring-2 ring-green-300',
    pending: 'bg-amber-400',
    future: 'bg-gray-200',
    failed: 'bg-red-500',
  };

  return (
    <div className="flex items-center gap-1">
      {stages.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-3 h-3 rounded-full ${dotColor[s.state] ?? 'bg-gray-200'}`} />
            <span className="text-[10px] text-gray-500 whitespace-nowrap">{s.label}</span>
          </div>
          {i < stages.length - 1 && (
            <div className={`w-6 h-0.5 mx-0.5 mt-[-12px] ${
              s.state === 'passed' || s.state === 'current' ? 'bg-green-400' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── SVG Icons (inline, no emoji) ────────────────────────────────────

function IconLink({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconKey({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function IconFileText({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconGitBranch({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────

function hasDeadlines(deadlines: unknown): boolean {
  if (!deadlines) return false;
  if (Array.isArray(deadlines)) return deadlines.length > 0;
  if (typeof deadlines === 'object') return Object.keys(deadlines as Record<string, unknown>).length > 0;
  return false;
}

function hasStages(stages: unknown): boolean {
  if (!stages) return false;
  if (Array.isArray(stages)) return stages.length > 0;
  if (typeof stages === 'object') return Object.keys(stages as Record<string, unknown>).length > 0;
  return false;
}

interface DeadlineEntry {
  label: string;
  date: string;
}

function parseDeadlines(deadlines: unknown): DeadlineEntry[] {
  if (!deadlines) return [];
  try {
    if (Array.isArray(deadlines)) {
      return deadlines
        .filter((d) => d && typeof d === 'object')
        .map((d: Record<string, unknown>) => ({
          label: String(d.label ?? d.type ?? d.name ?? ''),
          date: String(d.date ?? d.deadline ?? ''),
        }))
        .filter((d) => d.date);
    }
    if (typeof deadlines === 'object') {
      return Object.entries(deadlines as Record<string, unknown>)
        .map(([key, val]) => ({
          label: key,
          date: String(val ?? ''),
        }))
        .filter((d) => d.date);
    }
  } catch { /* ignore */ }
  return [];
}

function parseStages(stages: unknown): ParsedStage[] {
  if (!stages) return [];
  try {
    // If stages is an array of objects with key/state
    if (Array.isArray(stages)) {
      return stages
        .filter((s) => s && typeof s === 'object')
        .map((s: Record<string, unknown>) => {
          const key = String(s.key ?? s.name ?? s.stage ?? '');
          return {
            key,
            label: STAGE_LABELS[key] ?? key,
            state: (String(s.state ?? s.status ?? 'future')) as ParsedStage['state'],
          };
        });
    }
    // If stages is an object { stageKey: state }
    if (typeof stages === 'object') {
      const entries = Object.entries(stages as Record<string, unknown>);
      // Use STAGE_ORDER if keys match, otherwise use as-is
      const ordered = STAGE_ORDER.filter((k) => entries.some(([ek]) => ek === k));
      const extra = entries.filter(([k]) => !STAGE_ORDER.includes(k)).map(([k]) => k);
      return [...ordered, ...extra].map((key) => ({
        key,
        label: STAGE_LABELS[key] ?? key,
        state: (String((stages as Record<string, unknown>)[key] ?? 'future')) as ParsedStage['state'],
      }));
    }
  } catch { /* ignore */ }
  return [];
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
    <div className="text-center py-12">
      <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-center py-8 text-sm text-gray-400">{text}</p>
  );
}
