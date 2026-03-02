import { useState, useMemo } from 'react';
import type { UserAnalyticsSummary, UserActivitySummary, UserEventBreakdown } from '@jobsimplify/shared';
import { SortableHeader } from './shared';
import type { SortKey, SortDir } from './shared';
import UserDetailDrawer from './UserDetailDrawer';

export function UsersSection({
  users,
  getUserBreakdown: _getUserBreakdown,
}: {
  users: UserAnalyticsSummary[];
  getUserBreakdown: (userId: string) => Promise<UserEventBreakdown[]>;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

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
            <UserRow key={u.userId} user={u} />
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

function UserRow({ user }: { user: UserAnalyticsSummary }) {
  const completionPct = Math.round(user.profileCompletion * 100);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
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
  );
}

// ── V2 Users Section ──────────────────────────────────────────────────

export function UsersSectionV2({
  users,
  getUserBreakdown: _getUserBreakdown,
}: {
  users: UserActivitySummary[];
  getUserBreakdown: (userId: string) => Promise<UserEventBreakdown[]>;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [detailUser, setDetailUser] = useState<UserActivitySummary | null>(null);

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
            <th className="px-2 py-3.5 font-semibold w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sortedUsers.map((u) => (
            <UserRowV2
              key={u.userId}
              user={u}
              onDetail={() => setDetailUser(u)}
            />
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">ユーザーデータがありません</p>
        </div>
      )}

      {detailUser && (
        <UserDetailDrawer user={detailUser} onClose={() => setDetailUser(null)} />
      )}
    </div>
  );
}

function UserRowV2({
  user,
  onDetail,
}: {
  user: UserActivitySummary;
  onDetail: () => void;
}) {
  const returnPct = Math.round(user.returnRate * 100);
  const returnColor = returnPct >= 30 ? 'bg-green-500' : returnPct >= 15 ? 'bg-yellow-500' : 'bg-red-500';
  const last7Color = user.last7dEvents >= 10 ? 'bg-green-100 text-green-700' : user.last7dEvents >= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600';

  return (
    <tr className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={onDetail}>
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
      <td className="px-2 py-4 text-center">
        <button
          onClick={(e) => { e.stopPropagation(); onDetail(); }}
          className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-primary-600"
          title="詳細"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </td>
    </tr>
  );
}
