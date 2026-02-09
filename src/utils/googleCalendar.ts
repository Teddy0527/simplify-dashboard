import type { CompanyDeadline } from '@entrify/shared';

export function buildGoogleCalendarUrl(companyName: string, deadline: CompanyDeadline): string {
  const title = `${companyName} - ${deadline.label}`;

  let dates: string;
  if (deadline.time) {
    // 時間指定あり: 1時間枠
    const start = `${deadline.date.replace(/-/g, '')}T${deadline.time.replace(':', '')}00`;
    const startDate = new Date(`${deadline.date}T${deadline.time}:00`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    const endStr =
      endDate.getFullYear().toString() +
      String(endDate.getMonth() + 1).padStart(2, '0') +
      String(endDate.getDate()).padStart(2, '0') +
      'T' +
      String(endDate.getHours()).padStart(2, '0') +
      String(endDate.getMinutes()).padStart(2, '0') +
      '00';
    dates = `${start}/${endStr}`;
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
