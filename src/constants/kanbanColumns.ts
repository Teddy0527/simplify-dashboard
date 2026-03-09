import type { SelectionStatus } from '@jobsimplify/shared';

export interface ColumnDef {
  id: string;
  label: string;
  icon: string;
  color: string;
  statuses: SelectionStatus[];
}

export const COLUMNS: ColumnDef[] = [
  {
    id: 'interested',
    label: '興味あり',
    icon: '◇',
    color: 'var(--color-primary-500)',
    statuses: ['interested'],
  },
  {
    id: 'es_submitted',
    label: 'ES提出',
    icon: '→',
    color: 'var(--color-success-600)',
    statuses: ['es_submitted'],
  },
  {
    id: 'selection',
    label: '選考中',
    icon: '⟳',
    color: 'var(--color-warning-600)',
    statuses: ['webtest', 'gd', 'info_session', 'interview_1', 'interview_2', 'interview_3', 'interview_final', 'other'],
  },
  {
    id: 'offer',
    label: '内定',
    icon: '✓',
    color: 'var(--color-success-600)',
    statuses: ['offer'],
  },
  {
    id: 'closed',
    label: '不合格 / 辞退',
    icon: '—',
    color: 'var(--color-gray-400)',
    statuses: ['rejected', 'declined'],
  },
];

export const COLUMN_DEFAULT_STATUS: Record<string, SelectionStatus> = {
  interested: 'interested',
  es_submitted: 'es_submitted',
  selection: 'webtest',
  offer: 'offer',
  closed: 'rejected',
};

export function findColumnId(status: SelectionStatus): string {
  return COLUMNS.find((col) => col.statuses.includes(status))?.id ?? 'interested';
}
