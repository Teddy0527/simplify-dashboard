import { useState, useMemo } from 'react';
import { Company, STATUS_LABELS } from '../shared/types';

type SortKey = 'name' | 'industry' | 'status' | 'deadline' | 'updatedAt';
type SortDir = 'asc' | 'desc';

interface ListViewProps {
  companies: Company[];
  onCardClick: (company: Company) => void;
}

const STATUS_ORDER: Record<string, number> = {
  interested: 0, applied: 1, es_submitted: 2, webtest: 3, gd: 4,
  interview_1: 5, interview_2: 6, interview_3: 7, interview_final: 8,
  offer: 9, rejected: 10, declined: 11,
};

export default function ListView({ companies, onCardClick }: ListViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sorted = useMemo(() => {
    const arr = [...companies];
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return dir * a.name.localeCompare(b.name, 'ja');
        case 'industry':
          return dir * (a.industry ?? '').localeCompare(b.industry ?? '', 'ja');
        case 'status':
          return dir * ((STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99));
        case 'deadline': {
          const ad = a.deadline ?? '9999-12-31';
          const bd = b.deadline ?? '9999-12-31';
          return dir * ad.localeCompare(bd);
        }
        case 'updatedAt':
          return dir * a.updatedAt.localeCompare(b.updatedAt);
        default:
          return 0;
      }
    });
    return arr;
  }, [companies, sortKey, sortDir]);

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <span className="text-[var(--color-navy-300)] ml-1">&#8597;</span>;
    return <span className="ml-1">{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>;
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
  }

  const headers: { key: SortKey; label: string; className: string }[] = [
    { key: 'name', label: '企業名', className: 'flex-[2] min-w-[160px]' },
    { key: 'industry', label: '業界', className: 'flex-1 min-w-[100px]' },
    { key: 'status', label: 'ステータス', className: 'flex-1 min-w-[100px]' },
    { key: 'deadline', label: '締切', className: 'w-28' },
    { key: 'updatedAt', label: '更新日', className: 'w-28' },
  ];

  return (
    <div className="flex-1 overflow-auto custom-scrollbar px-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-2 py-3 border-b-2 border-[var(--color-navy-800)] sticky top-0 bg-[var(--color-paper)] z-10">
        {headers.map((h) => (
          <button
            key={h.key}
            onClick={() => toggleSort(h.key)}
            className={`${h.className} text-left text-xs font-semibold text-[var(--color-navy-700)] tracking-wide hover:text-[var(--color-navy-900)] transition-colors`}
          >
            {h.label}<SortIcon column={h.key} />
          </button>
        ))}
      </div>

      {/* Rows */}
      {sorted.length === 0 ? (
        <div className="text-center py-12 text-sm text-[var(--color-navy-400)]">該当する企業がありません</div>
      ) : (
        sorted.map((company) => (
          <div
            key={company.id}
            onClick={() => onCardClick(company)}
            className="flex items-center gap-2 py-3 border-b border-[var(--color-navy-100)] cursor-pointer hover:bg-white transition-colors"
          >
            <div className="flex-[2] min-w-[160px] flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--color-navy-900)] truncate">{company.name}</span>
            </div>
            <div className="flex-1 min-w-[100px] text-sm text-[var(--color-navy-600)]">
              {company.industry ?? '-'}
            </div>
            <div className="flex-1 min-w-[100px]">
              <span className={`status-badge status-badge-${company.status}`}>
                {STATUS_LABELS[company.status]}
              </span>
            </div>
            <div className="w-28 text-sm text-[var(--color-navy-600)]">
              {company.deadline ? formatDate(company.deadline) : '-'}
            </div>
            <div className="w-28 text-sm text-[var(--color-navy-500)]">
              {formatDate(company.updatedAt)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
