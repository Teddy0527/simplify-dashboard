import { useState, useMemo } from 'react';
import type { UserAnalyticsSummary, UserActivitySummary, UserEventBreakdown } from '@jobsimplify/shared';
import { SortableHeader } from './shared';
import type { SortKey, SortDir } from './shared';

export function UsersSection({
  users,
  getUserBreakdown,
}: {
  users: UserAnalyticsSummary[];
  getUserBreakdown: (userId: string) => Promise<UserEventBreakdown[]>;
}) {
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

  type V1SortKey = 'createdAt' | 'lastActiveAt' | 'companyCount' | 'esCount' | 'totalEvents' | 'profileCompletion';

  const sortedUsers = useMemo(() => {
    const key = sortKey as V1SortKey;
    const sorted = [...users].sort((a, b) => {
      const av: number | string = (a[key] as number | string) ?? '';
      const bv: number | string = (b[key] as number | string) ?? '';
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

  return (
    <div className="admin-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs text-gray-600">
            <th className="px-4 py-3.5 font-semibold">ユーザー</th>
            <SortableHeader label="登録日" sortKey="createdAt" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
            <SortableHeader label="最終活動" sortKey="lastActiveAt" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
            <SortableHeader label="企業" sortKey="companyCount" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
            <SortableHeader label="ES" sortKey="esCount" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
            <SortableHeader label="プロフィール" sortKey="profileCompletion" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
            <SortableHeader label="イベント" sortKey="totalEvents" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
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
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
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
        <td className="px-3 py-4 text-xs text-gray-600 tabular-nums whitespace-nowrap">
          {user.createdAt?.slice(0, 10)}
        </td>
        <td className="px-3 py-4 text-xs text-gray-600 tabular-nums whitespace-nowrap">
          {user.lastActiveAt?.slice(0, 10) ?? '-'}
        </td>
        <td className="px-3 py-4 text-center tabular-nums">{user.companyCount}</td>
        <td className="px-3 py-4 text-center tabular-nums">{user.esCount}</td>
        <td className="px-3 py-4">
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${completionPct >= 80 ? 'bg-green-500' : completionPct >= 40 ? 'bg-yellow-500' : 'bg-gray-300'}`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 tabular-nums w-8 text-right">{completionPct}%</span>
          </div>
        </td>
        <td className="px-3 py-4 text-center tabular-nums">{user.totalEvents}</td>
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

// ── V2 Users Section ──────────────────────────────────────────────────

export function UsersSectionV2({
  users,
  getUserBreakdown,
}: {
  users: UserActivitySummary[];
  getUserBreakdown: (userId: string) => Promise<UserEventBreakdown[]>;
}) {
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
    return [...users].sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      switch (sortKey) {
        case 'activeDays': av = a.activeDays; bv = b.activeDays; break;
        case 'returnRate': av = a.returnRate; bv = b.returnRate; break;
        case 'last7dEvents': av = a.last7dEvents; bv = b.last7dEvents; break;
        default: {
          av = (a as unknown as Record<string, number | string>)[sortKey] ?? '';
          bv = (b as unknown as Record<string, number | string>)[sortKey] ?? '';
        }
      }
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
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

  return (
    <div className="admin-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs text-gray-600">
            <th className="px-4 py-3.5 font-semibold">ユーザー</th>
            <SortableHeader label="登録日" sortKey="createdAt" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
            <SortableHeader label="最終活動" sortKey="lastActiveAt" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
            <SortableHeader label="企業" sortKey="companyCount" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
            <SortableHeader label="活動日数" sortKey="activeDays" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
            <SortableHeader label="復帰率" sortKey="returnRate" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
            <SortableHeader label="直近7日" sortKey="last7dEvents" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
            <SortableHeader label="イベント" sortKey="totalEvents" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sortedUsers.map((u) => (
            <UserRowV2
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
  );
}

function UserRowV2({
  user,
  isExpanded,
  onClick,
  breakdown,
  breakdownLoading,
}: {
  user: UserActivitySummary;
  isExpanded: boolean;
  onClick: () => void;
  breakdown: UserEventBreakdown[];
  breakdownLoading: boolean;
}) {
  const returnPct = Math.round(user.returnRate * 100);
  const returnColor = returnPct >= 30 ? 'bg-green-500' : returnPct >= 15 ? 'bg-yellow-500' : 'bg-red-500';
  const last7Color = user.last7dEvents >= 10 ? 'bg-green-100 text-green-700' : user.last7dEvents >= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600';

  return (
    <>
      <tr className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={onClick}>
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                {(user.fullName ?? user.email).charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              {user.fullName && <p className="text-sm font-medium text-gray-900 truncate">{user.fullName}</p>}
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-4 text-xs text-gray-600 tabular-nums whitespace-nowrap">
          {user.createdAt?.slice(0, 10)}
        </td>
        <td className="px-3 py-4 text-xs text-gray-600 tabular-nums whitespace-nowrap">
          {user.lastActiveAt?.slice(0, 10) ?? '-'}
        </td>
        <td className="px-3 py-4 text-center tabular-nums">{user.companyCount}</td>
        <td className="px-3 py-4 text-center tabular-nums">{user.activeDays}</td>
        <td className="px-3 py-4">
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${returnColor}`} style={{ width: `${Math.min(returnPct, 100)}%` }} />
            </div>
            <span className="text-xs text-gray-500 tabular-nums w-8 text-right">{returnPct}%</span>
          </div>
        </td>
        <td className="px-3 py-4 text-center">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums ${last7Color}`}>
            {user.last7dEvents}
          </span>
        </td>
        <td className="px-3 py-4 text-center tabular-nums">{user.totalEvents}</td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={8} className="px-4 py-3 bg-gray-50">
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
