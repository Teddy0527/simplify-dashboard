export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  htmlLink: string;
  reminders?: {
    useDefault: boolean;
    overrides?: { method: string; minutes: number }[];
  };
}

export interface CalendarEventDisplay {
  id: string;
  title: string;
  dateStr: string;       // YYYY-MM-DD
  startTime?: string;    // HH:mm
  endTime?: string;      // HH:mm
  isAllDay: boolean;
  htmlLink: string;
  source: 'google' | 'stage';
  companyId?: string;
  color?: string;
}

export interface CalendarSettings {
  id: string;
  userId: string;
  isConnected: boolean;
  isTestUserApproved: boolean;
  calendarId: string | null;
  connectedAt: string | null;
  googleTokenExpiresAt: string | null;
  googleEmail: string | null;
}

export interface GCalEventPayload {
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  reminders?: {
    useDefault: boolean;
    overrides?: { method: string; minutes: number }[];
  };
}

export interface GoogleCalendarListEntry {
  id: string;
  summary: string;
  primary?: boolean;
  accessRole: string;
}
