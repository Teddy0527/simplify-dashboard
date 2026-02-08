import type { GoogleCalendarEvent } from '../types/googleCalendar';

export class GoogleCalendarAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleCalendarAuthError';
  }
}

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

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

  if (res.status === 401 || res.status === 403) {
    throw new GoogleCalendarAuthError('Token expired or insufficient permissions');
  }

  if (!res.ok) {
    throw new Error(`Google Calendar API error: ${res.status}`);
  }

  const data = await res.json();
  return data.items ?? [];
}
