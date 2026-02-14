import type { CompanyDeadline, DeadlinePresetWithCompany } from '@jobsimplify/shared';
import { DEADLINE_TYPE_LABELS, type DeadlineType } from '@jobsimplify/shared';

/** "HH:mm:ss" or "HH:mm" → "HH:mm" */
function normalizeTime(time: string): string {
  return time.slice(0, 5);
}

export function buildGoogleCalendarUrl(companyName: string, deadline: CompanyDeadline): string {
  const title = `${companyName} - ${deadline.label}`;

  let dates: string;
  if (deadline.time) {
    // 時間指定あり: 開始=終了の1点イベント
    const time = normalizeTime(deadline.time);
    const start = `${deadline.date.replace(/-/g, '')}T${time.replace(':', '')}00`;
    dates = `${start}/${start}`;
  } else {
    // 終日イベント: 排他的終了日ルール（翌日を指定）
    const startStr = deadline.date.replace(/-/g, '');
    const nextDay = new Date(deadline.date);
    nextDay.setDate(nextDay.getDate() + 1);
    const endStr =
      nextDay.getFullYear().toString() +
      String(nextDay.getMonth() + 1).padStart(2, '0') +
      String(nextDay.getDate()).padStart(2, '0');
    dates = `${startStr}/${endStr}`;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates,
    ctz: 'Asia/Tokyo',
  });

  if (deadline.memo) {
    params.set('details', deadline.memo);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildPresetGoogleCalendarUrl(entry: DeadlinePresetWithCompany): string {
  const label = DEADLINE_TYPE_LABELS[entry.deadlineType as DeadlineType] || entry.deadlineType;
  const title = `${entry.companyName} - ${label}`;

  let dates: string;
  if (entry.deadlineTime) {
    const time = normalizeTime(entry.deadlineTime);
    const start = `${entry.deadlineDate.replace(/-/g, '')}T${time.replace(':', '')}00`;
    dates = `${start}/${start}`;
  } else {
    const startStr = entry.deadlineDate.replace(/-/g, '');
    const nextDay = new Date(entry.deadlineDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const endStr =
      nextDay.getFullYear().toString() +
      String(nextDay.getMonth() + 1).padStart(2, '0') +
      String(nextDay.getDate()).padStart(2, '0');
    dates = `${startStr}/${endStr}`;
  }

  const details = [
    `カテゴリ: ${label}`,
    entry.sourceUrl ? `ソース: ${entry.sourceUrl}` : '',
    entry.memo ? `\n${entry.memo}` : '',
  ].filter(Boolean).join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates,
    details,
    ctz: 'Asia/Tokyo',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export interface CreateEventPayload {
  summary: string;
  description: string;
  start: { date?: string; dateTime?: string; timeZone: string };
  end: { date?: string; dateTime?: string; timeZone: string };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: 'popup' | 'email'; minutes: number }>;
  };
}

export function presetToCalendarEvent(entry: DeadlinePresetWithCompany, reminderDaysBefore?: number): CreateEventPayload {
  const label = DEADLINE_TYPE_LABELS[entry.deadlineType as DeadlineType] || entry.deadlineType;
  const summary = `${entry.companyName} - ${label}`;
  const description = [
    `カテゴリ: ${label}`,
    entry.sourceUrl ? `ソース: ${entry.sourceUrl}` : '',
    entry.memo ? `\n${entry.memo}` : '',
  ].filter(Boolean).join('\n');

  const timeZone = 'Asia/Tokyo';

  const reminders = reminderDaysBefore != null
    ? {
        useDefault: false,
        overrides: [
          { method: 'popup' as const, minutes: Math.min(reminderDaysBefore * 24 * 60, 40320) },
          { method: 'email' as const, minutes: Math.min(reminderDaysBefore * 24 * 60, 40320) },
        ],
      }
    : undefined;

  if (entry.deadlineTime) {
    const dateTime = `${entry.deadlineDate}T${normalizeTime(entry.deadlineTime)}:00`;
    const startDate = new Date(`${dateTime}+09:00`);
    return {
      summary,
      description,
      start: { dateTime: startDate.toISOString(), timeZone },
      end: { dateTime: startDate.toISOString(), timeZone },
      reminders,
    };
  }

  // All-day event
  const nextDay = new Date(entry.deadlineDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const endDate =
    nextDay.getFullYear().toString() +
    '-' +
    String(nextDay.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(nextDay.getDate()).padStart(2, '0');

  return {
    summary,
    description,
    start: { date: entry.deadlineDate, timeZone },
    end: { date: endDate, timeZone },
    reminders,
  };
}
