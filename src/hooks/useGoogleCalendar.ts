import { useState, useEffect, useMemo, useCallback } from 'react';
import { getSupabase } from '@jobsimplify/shared';
import { fetchCalendarEvents, GoogleCalendarAuthError } from '../utils/googleCalendarApi';
import type { CalendarEventDisplay, GoogleCalendarEvent } from '../types/googleCalendar';
import { buildGoogleOAuthOptions } from '../constants/oauth';

const STORAGE_KEY_ENABLED = 'simplify:gcal-enabled';
const STORAGE_KEY_TOKEN = 'simplify:gcal-token';

interface StoredToken {
  token: string;
  expiresAt: number;
}

export function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (!raw) return null;
    const parsed: StoredToken = JSON.parse(raw);
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      return null;
    }
    return parsed.token;
  } catch {
    return null;
  }
}

function normalizeEvent(event: GoogleCalendarEvent): CalendarEventDisplay {
  const isAllDay = !event.start.dateTime;
  let dateStr: string;
  let startTime: string | undefined;

  if (event.start.dateTime) {
    const dt = new Date(event.start.dateTime);
    dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    startTime = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  } else {
    dateStr = event.start.date!;
  }

  return {
    id: event.id,
    title: event.summary || '(予定なし)',
    dateStr,
    startTime,
    isAllDay,
    htmlLink: event.htmlLink,
  };
}

interface UseGoogleCalendarReturn {
  events: CalendarEventDisplay[];
  loading: boolean;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  tokenAvailable: boolean;
  reconnect: () => void;
}

export function useGoogleCalendar(year: number, month: number): UseGoogleCalendarReturn {
  const [enabled, _setEnabled] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_ENABLED) === 'true';
  });
  const [events, setEvents] = useState<CalendarEventDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [tokenAvailable, setTokenAvailable] = useState(() => !!getStoredToken());

  const setEnabled = useCallback((v: boolean) => {
    _setEnabled(v);
    localStorage.setItem(STORAGE_KEY_ENABLED, String(v));
  }, []);

  const reconnect = useCallback(() => {
    getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: buildGoogleOAuthOptions(
        window.location.origin + window.location.pathname + window.location.search,
        true,
      ),
    });
  }, []);

  // Fetch events when enabled + token available + month changes
  useEffect(() => {
    if (!enabled) {
      setEvents([]);
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setTokenAvailable(false);
      setEvents([]);
      return;
    }

    setTokenAvailable(true);
    setLoading(true);

    const timeMin = new Date(year, month, 1).toISOString();
    const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    fetchCalendarEvents(token, timeMin, timeMax)
      .then(rawEvents => {
        setEvents(rawEvents.map(normalizeEvent));
      })
      .catch(err => {
        if (err instanceof GoogleCalendarAuthError) {
          localStorage.removeItem(STORAGE_KEY_TOKEN);
          setTokenAvailable(false);
        }
        setEvents([]);
      })
      .finally(() => setLoading(false));
  }, [enabled, year, month]);

  return { events, loading, enabled, setEnabled, tokenAvailable, reconnect };
}

export function useGoogleCalendarEventMap(events: CalendarEventDisplay[]) {
  return useMemo(() => {
    const map = new Map<string, CalendarEventDisplay[]>();
    for (const ev of events) {
      const list = map.get(ev.dateStr) || [];
      list.push(ev);
      map.set(ev.dateStr, list);
    }
    return map;
  }, [events]);
}
