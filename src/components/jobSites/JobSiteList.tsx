import { useState, useMemo } from 'react';
import {
  JobSite,
  JobSiteCategory,
  JOB_SITE_CATEGORY_LABELS,
} from '@jobsimplify/shared';
import JobSiteCard from './JobSiteCard';
import EmptyState from '../Common/EmptyState';

interface JobSiteListProps {
  sites: JobSite[];
  onEdit: (site: JobSite) => void;
  onDelete: (site: JobSite) => void;
  onMarkChecked: (site: JobSite) => void;
}

export default function JobSiteList({ sites, onEdit, onDelete, onMarkChecked }: JobSiteListProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<JobSiteCategory | ''>('');

  const filtered = useMemo(() => {
    let result = sites;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.url?.toLowerCase().includes(q),
      );
    }
    if (categoryFilter) {
      result = result.filter((s) => s.category === categoryFilter);
    }
    return result;
  }, [sites, search, categoryFilter]);

  if (sites.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        }
        title="まだサイトが登録されていません"
        description="「+ サイトを追加」から就活サイトを登録して、一元管理を始めましょう。"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 text-sm"
            placeholder="サイト名・URLで検索..."
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as JobSiteCategory | '')}
          className="select-field text-sm w-40"
        >
          <option value="">すべてのカテゴリ</option>
          {(Object.entries(JOB_SITE_CATEGORY_LABELS) as [JobSiteCategory, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ),
          )}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">条件に一致するサイトがありません</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((site) => (
            <JobSiteCard
              key={site.id}
              site={site}
              onEdit={onEdit}
              onDelete={onDelete}
              onMarkChecked={onMarkChecked}
            />
          ))}
        </div>
      )}
    </div>
  );
}
