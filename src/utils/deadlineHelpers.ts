import type { CompanyDeadline, SelectionStage } from '@simplify/shared';
import { STATUS_LABELS } from '@simplify/shared';

/** 未来の締切のうち最も近いものを返す。なければ直近の過去（overdue）を返す */
export function getNearestDeadline(deadlines: CompanyDeadline[]): CompanyDeadline | null {
  if (!deadlines || deadlines.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sorted = [...deadlines].sort((a, b) => a.date.localeCompare(b.date));

  // 未来の締切のうち最も近いもの
  const future = sorted.find(d => new Date(d.date) >= today);
  if (future) return future;

  // なければ直近の過去
  return sorted[sorted.length - 1];
}

/** 今日からの残日数（負=過去） */
export function daysUntilDeadline(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** overdue: 過去, urgent: 0〜3日, soon: 4〜7日, normal: 8日以上 */
export function getDeadlineUrgency(dateStr: string): 'overdue' | 'urgent' | 'soon' | 'normal' {
  const days = daysUntilDeadline(dateStr);
  if (days < 0) return 'overdue';
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'soon';
  return 'normal';
}

/** "期限切れ", "今日", "明日", "あと3日", "1/15" 等 */
export function formatDeadlineShort(dateStr: string): string {
  const days = daysUntilDeadline(dateStr);
  if (days < 0) return '期限切れ';
  if (days === 0) return '今日';
  if (days === 1) return '明日';
  if (days <= 7) return `あと${days}日`;
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** stages[]から最初のresult='pending'ステップを返す */
export function getNextSelectionStep(stages: SelectionStage[]): { label: string; date?: string; time?: string } | null {
  const pending = stages.find(s => s.result === 'pending');
  if (!pending) return null;
  return {
    label: pending.customLabel || (STATUS_LABELS[pending.type] ?? pending.type),
    date: pending.date,
    time: pending.time,
  };
}
