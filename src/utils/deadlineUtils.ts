import type { DeadlineType } from '@jobsimplify/shared';

export function daysUntilDeadline(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDeadlineUrgency(dateStr: string): 'overdue' | 'urgent' | 'soon' | 'normal' {
  const days = daysUntilDeadline(dateStr);
  if (days < 0) return 'overdue';
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'soon';
  return 'normal';
}

export function formatDeadlineShort(dateStr: string): string {
  const days = daysUntilDeadline(dateStr);
  if (days < 0) return '期限切れ';
  if (days === 0) return '今日';
  if (days === 1) return '明日';
  if (days <= 7) return `あと${days}日`;
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export const DEADLINE_EMOJI: Record<DeadlineType, string> = {
  es_submission: '\u{1F4DD}',
  internship: '\u{1F4BC}',
  webtest: '\u{1F4BB}',
  interview: '\u{1F454}',
  offer_response: '\u{1F389}',
  document: '\u{1F4C4}',
  event: '\u{1F4C5}',
  other: '\u{1F4CC}',
};
