export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink: string;
}

export interface CalendarEventDisplay {
  id: string;
  title: string;
  dateStr: string;       // YYYY-MM-DD
  startTime?: string;    // HH:mm
  isAllDay: boolean;
  htmlLink: string;
}
