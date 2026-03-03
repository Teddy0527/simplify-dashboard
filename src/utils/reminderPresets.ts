import type { DeadlineType } from '@jobsimplify/shared';

interface ReminderOverride {
  method: 'popup';
  minutes: number;
}

export function getReminderOverrides(type: DeadlineType): ReminderOverride[] {
  switch (type) {
    case 'es_submission':
    case 'webtest':
    case 'internship':
      return [
        { method: 'popup', minutes: 7 * 24 * 60 },   // 7日前
        { method: 'popup', minutes: 3 * 24 * 60 },   // 3日前
        { method: 'popup', minutes: 1 * 24 * 60 },   // 1日前
      ];
    case 'interview':
      return [
        { method: 'popup', minutes: 1 * 24 * 60 },   // 1日前
        { method: 'popup', minutes: 2 * 60 },          // 2時間前
      ];
    case 'offer_response':
      return [
        { method: 'popup', minutes: 5 * 24 * 60 },   // 5日前
        { method: 'popup', minutes: 2 * 24 * 60 },   // 2日前
        { method: 'popup', minutes: 1 * 24 * 60 },   // 1日前
      ];
    default:
      return [
        { method: 'popup', minutes: 3 * 24 * 60 },   // 3日前
        { method: 'popup', minutes: 1 * 24 * 60 },   // 1日前
      ];
  }
}
