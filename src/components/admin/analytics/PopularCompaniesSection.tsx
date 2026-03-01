import { useState, useEffect, useMemo } from 'react';
import { getRegisteredCompanyRanking } from '@jobsimplify/shared';
import type { RegisteredCompanyRanking } from '@jobsimplify/shared';
import { CompanyLogo } from '../../ui/CompanyLogo';

type SortField = 'userCount' | 'companyName' | 'industry';
type SortDir = 'asc' | 'desc';

export default function PopularCompaniesSection() {
  const [data, setData] = useState<RegisteredCompanyRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortField>('userCount');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    getRegisteredCompanyRanking()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (key: SortField) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'userCount' ? 'desc' : 'asc');
    }
  };

  const filtered = useMemo(() => {
    let list = data;
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((r) => r.companyName.toLowerCase().includes(q));
    }
    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'userCount') {
        cmp = a.userCount - b.userCount;
      } else if (sortKey === 'companyName') {
        cmp = a.companyName.localeCompare(b.companyName, 'ja');
      } else if (sortKey === 'industry') {
        cmp = (a.industry ?? '').localeCompare(b.industry ?? '', 'ja');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [data, query, sortKey, sortDir]);

  const SortHeader = ({ label, field }: { label: string; field: SortField }) => {
    const isActive = sortKey === field;
    return (
      <th
        className="px-3 py-3.5 cursor-pointer select-none hover:text-gray-700 whitespace-nowrap font-semibold text-gray-600"
        onClick={() => handleSort(field)}
      >
        {label}
        {isActive && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </th>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin mb-2" />
        <p className="text-sm">読み込み中...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input-field flex-1"
          placeholder="企業名で検索..."
        />
        <span className="text-xs text-gray-500 whitespace-nowrap">{filtered.length}件</span>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs uppercase tracking-wide">
                <th className="px-3 py-3.5 font-semibold text-gray-600 w-12">#</th>
                <SortHeader label="企業名" field="companyName" />
                <SortHeader label="業界" field="industry" />
                <SortHeader label="登録ユーザー数" field="userCount" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((row, idx) => (
                <tr key={`${row.companyName}-${row.websiteDomain ?? idx}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 text-gray-400 tabular-nums">{idx + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <CompanyLogo
                        name={row.companyName}
                        websiteDomain={row.websiteDomain}
                        size="sm"
                      />
                      <span className="font-medium text-gray-900">{row.companyName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-600">{row.industry ?? '-'}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {row.userCount}人
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-12 text-center text-gray-400">
                    該当する企業が見つかりませんでした
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
