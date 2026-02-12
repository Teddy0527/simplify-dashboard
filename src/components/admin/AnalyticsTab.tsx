import { useState, useMemo } from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import type { UserAnalyticsSummary, UserEventBreakdown, AggregateTrend } from '@jobsimplify/shared';

type SortKey = 'createdAt' | 'lastActiveAt' | 'companyCount' | 'esCount' | 'totalEvents' | 'profileCompletion';
type SortDir = 'asc' | 'desc';

export default function AnalyticsTab() {
  const { users, trends, loading, getUserBreakdown } = useAnalytics();
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<UserEventBreakdown[]>([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortedUsers = useMemo(() => {
    const sorted = [...users].sort((a, b) => {
      let av: number | string = a[sortKey] ?? '';
      let bv: number | string = b[sortKey] ?? '';
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return sorted;
  }, [users, sortKey, sortDir]);

  const handleRowClick = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);
    setBreakdownLoading(true);
    const data = await getUserBreakdown(userId);
    setBreakdown(data);
    setBreakdownLoading(false);
  };

  // Summary stats
  const totalUsers = users.length;
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const activeUsers = users.filter((u) => u.lastActiveAt && u.lastActiveAt >= sevenDaysAgo).length;
  const totalEvents = users.reduce((sum, u) => sum + u.totalEvents, 0);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin mb-2" />
        <p className="text-sm">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="合計ユーザー" value={totalUsers} />
        <SummaryCard label="アクティブ（7日）" value={activeUsers} />
        <SummaryCard label="総イベント数" value={totalEvents} />
      </div>

      {/* Activity bar chart (14 days) */}
      <ActivityChart trends={trends} />

      {/* User table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">ユーザー</th>
              <SortableHeader label="登録日" sortKey="createdAt" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
              <SortableHeader label="最終活動" sortKey="lastActiveAt" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
              <SortableHeader label="企業" sortKey="companyCount" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
              <SortableHeader label="ES" sortKey="esCount" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
              <SortableHeader label="プロフィール" sortKey="profileCompletion" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
              <SortableHeader label="イベント" sortKey="totalEvents" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedUsers.map((u) => (
              <UserRow
                key={u.userId}
                user={u}
                isExpanded={expandedUserId === u.userId}
                onClick={() => handleRowClick(u.userId)}
                breakdown={expandedUserId === u.userId ? breakdown : []}
                breakdownLoading={expandedUserId === u.userId && breakdownLoading}
              />
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">ユーザーデータがありません</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  currentKey,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  dir: SortDir;
  onClick: (key: SortKey) => void;
}) {
  const isActive = currentKey === sortKey;
  return (
    <th
      className="px-3 py-3 cursor-pointer select-none hover:text-gray-700 whitespace-nowrap"
      onClick={() => onClick(sortKey)}
    >
      {label}
      {isActive && (
        <span className="ml-1">{dir === 'asc' ? '↑' : '↓'}</span>
      )}
    </th>
  );
}

function ActivityChart({ trends }: { trends: AggregateTrend[] }) {
  // Aggregate by day
  const dailyTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of trends) {
      map.set(t.day, (map.get(t.day) ?? 0) + t.eventCount);
    }
    // Sort by date ascending, take last 14 days
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14);
  }, [trends]);

  if (dailyTotals.length === 0) {
    return (
      <div className="card px-4 py-6 text-center text-gray-400 text-sm">
        アクティビティデータがありません
      </div>
    );
  }

  const maxCount = Math.max(...dailyTotals.map(([, c]) => c), 1);

  return (
    <div className="card px-4 py-4">
      <p className="text-xs text-gray-500 mb-3">直近14日のアクティビティ</p>
      <div className="flex items-end gap-1 h-24">
        {dailyTotals.map(([day, count]) => (
          <div key={day} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-primary-500 rounded-t min-h-[2px]"
              style={{ height: `${(count / maxCount) * 100}%` }}
              title={`${day}: ${count}件`}
            />
            <span className="text-[9px] text-gray-400 tabular-nums">
              {day.slice(5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserRow({
  user,
  isExpanded,
  onClick,
  breakdown,
  breakdownLoading,
}: {
  user: UserAnalyticsSummary;
  isExpanded: boolean;
  onClick: () => void;
  breakdown: UserEventBreakdown[];
  breakdownLoading: boolean;
}) {
  const completionPct = Math.round(user.profileCompletion * 100);

  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onClick}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                {(user.fullName ?? user.email).charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              {user.fullName && (
                <p className="text-sm font-medium text-gray-900 truncate">{user.fullName}</p>
              )}
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-xs text-gray-600 tabular-nums whitespace-nowrap">
          {user.createdAt?.slice(0, 10)}
        </td>
        <td className="px-3 py-3 text-xs text-gray-600 tabular-nums whitespace-nowrap">
          {user.lastActiveAt?.slice(0, 10) ?? '-'}
        </td>
        <td className="px-3 py-3 text-center tabular-nums">{user.companyCount}</td>
        <td className="px-3 py-3 text-center tabular-nums">{user.esCount}</td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${completionPct >= 80 ? 'bg-green-500' : completionPct >= 40 ? 'bg-yellow-500' : 'bg-gray-300'}`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 tabular-nums w-8 text-right">{completionPct}%</span>
          </div>
        </td>
        <td className="px-3 py-3 text-center tabular-nums">{user.totalEvents}</td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={7} className="px-4 py-3 bg-gray-50">
            {breakdownLoading ? (
              <div className="text-center py-4">
                <div className="inline-block w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : breakdown.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">イベントデータなし</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">イベント内訳</p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-400">
                        <th className="text-left pb-1">イベント</th>
                        <th className="text-right pb-1">回数</th>
                        <th className="text-right pb-1">最終</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakdown.map((b) => (
                        <tr key={b.eventType} className="text-gray-600">
                          <td className="py-0.5">{b.eventType}</td>
                          <td className="text-right tabular-nums">{b.eventCount}</td>
                          <td className="text-right tabular-nums text-gray-400">{b.lastAt?.slice(0, 10)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">カテゴリ別</p>
                  <CategorySummary breakdown={breakdown} />
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function CategorySummary({ breakdown }: { breakdown: UserEventBreakdown[] }) {
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of breakdown) {
      map.set(b.eventCategory, (map.get(b.eventCategory) ?? 0) + b.eventCount);
    }
    return [...map.entries()].sort(([, a], [, b]) => b - a);
  }, [breakdown]);

  const maxCount = Math.max(...categories.map(([, c]) => c), 1);

  return (
    <div className="space-y-1.5">
      {categories.map(([cat, count]) => (
        <div key={cat} className="flex items-center gap-2">
          <span className="text-xs text-gray-600 w-24 truncate">{cat}</span>
          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-400 rounded-full"
              style={{ width: `${(count / maxCount) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 tabular-nums w-8 text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}
