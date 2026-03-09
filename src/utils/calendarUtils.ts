import type { CalendarEventDisplay } from '../types/googleCalendar';

/**
 * Format HH:mm time string to Japanese format.
 * "14:00" → "午後2時", "09:30" → "午前9:30", "00:00" → "午前0時"
 */
export function formatTimeJa(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const isAM = h < 12;
  const period = isAM ? '午前' : '午後';
  const hour12 = h === 0 ? 0 : h <= 12 ? h : h - 12;

  if (m === 0) {
    return `${period}${hour12}時`;
  }
  return `${period}${hour12}:${String(m).padStart(2, '0')}`;
}

/**
 * Parse HH:mm to fractional hours (e.g., "14:30" → 14.5)
 */
export function timeToHours(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
}

/**
 * Calculate overlapping event columns for week view.
 * Returns events augmented with column and totalColumns.
 */
export interface PositionedEvent {
  event: CalendarEventDisplay;
  column: number;
  totalColumns: number;
  startHour: number;
  endHour: number;
}

export function calculateEventPositions(events: CalendarEventDisplay[]): PositionedEvent[] {
  const timedEvents = events
    .filter((e) => !e.isAllDay && e.startTime)
    .map((e) => ({
      event: e,
      startHour: timeToHours(e.startTime!),
      endHour: e.endTime ? timeToHours(e.endTime) : timeToHours(e.startTime!) + 1,
      column: 0,
      totalColumns: 1,
    }))
    .sort((a, b) => a.startHour - b.startHour || a.endHour - b.endHour);

  // Find overlapping groups
  const groups: PositionedEvent[][] = [];
  let currentGroup: PositionedEvent[] = [];
  let groupEnd = -1;

  for (const ev of timedEvents) {
    if (currentGroup.length === 0 || ev.startHour < groupEnd) {
      currentGroup.push(ev);
      groupEnd = Math.max(groupEnd, ev.endHour);
    } else {
      if (currentGroup.length > 0) groups.push(currentGroup);
      currentGroup = [ev];
      groupEnd = ev.endHour;
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup);

  // Assign columns within each group
  for (const group of groups) {
    const columns: number[] = []; // tracks end time of each column
    for (const ev of group) {
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        if (ev.startHour >= columns[c]) {
          ev.column = c;
          columns[c] = ev.endHour;
          placed = true;
          break;
        }
      }
      if (!placed) {
        ev.column = columns.length;
        columns.push(ev.endHour);
      }
    }
    const totalCols = columns.length;
    for (const ev of group) {
      ev.totalColumns = totalCols;
    }
  }

  return timedEvents;
}
