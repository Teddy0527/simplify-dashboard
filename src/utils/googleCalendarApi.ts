import type { GoogleCalendarEvent } from '../types/googleCalendar';
import type { CreateEventPayload } from './googleCalendar';

export class GoogleCalendarAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleCalendarAuthError';
  }
}

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

interface GoogleApiErrorBody {
  error?: {
    message?: string;
    errors?: Array<{ reason?: string }>;
  };
}

async function parseGoogleApiError(res: Response): Promise<GoogleApiErrorBody> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

async function throwGoogleCalendarError(res: Response): Promise<never> {
  const body = await parseGoogleApiError(res);
  const reason = body.error?.errors?.[0]?.reason;
  const message = body.error?.message || `Google Calendar API error: ${res.status}`;

  if (res.status === 401) {
    throw new GoogleCalendarAuthError('Google calendar token expired');
  }

  if (res.status === 403) {
    if (reason === 'insufficientPermissions' || reason === 'authError') {
      throw new GoogleCalendarAuthError('Google calendar permissions are missing');
    }
    if (reason === 'accessNotConfigured' || reason === 'serviceDisabled') {
      throw new Error('Google Calendar API is disabled in Google Cloud project');
    }
    throw new GoogleCalendarAuthError(message);
  }

  throw new Error(message);
}

export async function fetchCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string,
): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin,
    timeMax,
    maxResults: '250',
  });

  const res = await fetch(
    `${CALENDAR_API_BASE}/calendars/primary/events?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!res.ok) {
    await throwGoogleCalendarError(res);
  }

  const data = await res.json();
  return data.items ?? [];
}

export async function createCalendarEvent(
  accessToken: string,
  event: CreateEventPayload,
): Promise<GoogleCalendarEvent> {
  const res = await fetch(
    `${CALENDAR_API_BASE}/calendars/primary/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    },
  );

  if (!res.ok) {
    await throwGoogleCalendarError(res);
  }

  return res.json();
}

export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string,
): Promise<void> {
  const res = await fetch(
    `${CALENDAR_API_BASE}/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  // 404 = already deleted, treat as success
  if (res.status === 404) return;

  if (!res.ok) {
    await throwGoogleCalendarError(res);
  }
}
