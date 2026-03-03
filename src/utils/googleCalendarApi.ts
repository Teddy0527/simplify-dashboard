import type { GoogleCalendarEvent, GCalEventPayload, GoogleCalendarListEntry } from '../types/googleCalendar';

const GCAL_BASE = 'https://www.googleapis.com/calendar/v3';

async function gcalFetch(token: string, url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    throw new Error(`Google Calendar API error (${res.status}): ${err}`);
  }
  return res;
}

export async function createSubCalendar(token: string): Promise<string> {
  const res = await gcalFetch(token, `${GCAL_BASE}/calendars`, {
    method: 'POST',
    body: JSON.stringify({
      summary: 'Simplify 就活',
      description: 'Simplifyで管理している就活の締切・予定',
      timeZone: 'Asia/Tokyo',
    }),
  });
  const data = await res.json();
  return data.id;
}

export async function findSimplifyCalendar(token: string): Promise<string | null> {
  const res = await gcalFetch(token, `${GCAL_BASE}/users/me/calendarList`);
  const data = await res.json();
  const found = data.items?.find((c: GoogleCalendarListEntry) => c.summary === 'Simplify 就活');
  return found?.id ?? null;
}

export async function createEvent(
  token: string,
  calendarId: string,
  payload: GCalEventPayload,
): Promise<string> {
  const res = await gcalFetch(token, `${GCAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.id;
}

export async function updateEvent(
  token: string,
  calendarId: string,
  eventId: string,
  payload: GCalEventPayload,
): Promise<void> {
  await gcalFetch(
    token,
    `${GCAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: 'PUT', body: JSON.stringify(payload) },
  );
}

export async function deleteEvent(
  token: string,
  calendarId: string,
  eventId: string,
): Promise<void> {
  await gcalFetch(
    token,
    `${GCAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: 'DELETE' },
  );
}

export async function listEvents(
  token: string,
  calendarIds: string[],
  timeMin: string,
  timeMax: string,
): Promise<GoogleCalendarEvent[]> {
  const allEvents: GoogleCalendarEvent[] = [];
  for (const calendarId of calendarIds) {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
    });
    const res = await gcalFetch(
      token,
      `${GCAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    );
    const data = await res.json();
    if (data.items) {
      allEvents.push(...data.items);
    }
  }
  return allEvents;
}

export async function listCalendars(token: string): Promise<GoogleCalendarListEntry[]> {
  const res = await gcalFetch(token, `${GCAL_BASE}/users/me/calendarList`);
  const data = await res.json();
  return data.items ?? [];
}
