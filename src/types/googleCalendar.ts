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
  source: 'simplify' | 'google';
  companyId?: string;
  urgency?: 'overdue' | 'urgent' | 'soon' | 'normal';
  color?: string;
}

export interface CalendarSettings {
  id: string;
  userId: string;
  isConnected: boolean;
  calendarId: string | null;
  connectedAt: string | null;
  googleTokenExpiresAt: string | null;
}

export interface CalendarSyncEvent {
  id: string;
  userId: string;
  applicationId: string;
  deadlineId: string;
  googleEventId: string;
  calendarId: string;
  lastSyncedAt: string;
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

export interface CalendarSyncQueueItem {
  id: string;
  userId: string;
  applicationId: string;
  deadlineId: string;
  action: 'create' | 'update' | 'delete';
  payload: GCalEventPayload | null;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: string;
  errorMessage: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface GoogleCalendarListEntry {
  id: string;
  summary: string;
  primary?: boolean;
  accessRole: string;
}
