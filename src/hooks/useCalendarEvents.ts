import { useState, useEffect, useMemo } from 'react';
import { useGoogleCalendar } from './useGoogleCalendar';
import { listEvents, listCalendars } from '../utils/googleCalendarApi';
import type { CalendarEventDisplay } from '../types/googleCalendar';

interface UseCalendarEventsReturn {
  events: CalendarEventDisplay[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useCalendarEvents(timeMin: string, timeMax: string): UseCalendarEventsReturn {
  const { isConnected, getAccessToken, calendarId } = useGoogleCalendar();
  const [googleEvents, setGoogleEvents] = useState<CalendarEventDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadGoogleEvents() {
    if (!isConnected) {
      setGoogleEvents([]);
      return;
    }
    try {
      const token = await getAccessToken();
      // Get all calendars except the Simplify sub-calendar
      const calendars = await listCalendars(token);
      const calIds = calendars
        .filter((c) => c.id !== calendarId)
        .map((c) => c.id);

      if (calIds.length === 0) {
        setGoogleEvents([]);
        return;
      }

      const rawEvents = await listEvents(token, calIds, timeMin, timeMax);
      const mapped: CalendarEventDisplay[] = rawEvents.map((ev) => {
        const startDt = ev.start.dateTime || ev.start.date || '';
        const dateStr = startDt.slice(0, 10);
        const startTime = ev.start.dateTime ? ev.start.dateTime.slice(11, 16) : undefined;
        const endTime = ev.end?.dateTime ? ev.end.dateTime.slice(11, 16) : undefined;

        return {
          id: `gcal-${ev.id}`,
          title: ev.summary || '(no title)',
          dateStr,
          startTime,
          endTime,
          isAllDay: !ev.start.dateTime,
          htmlLink: ev.htmlLink,
          source: 'google' as const,
        };
      });

      setGoogleEvents(mapped);
    } catch (err) {
      console.error('Failed to load Google Calendar events:', err);
      setGoogleEvents([]);
    }
  }

  async function refresh() {
    setIsLoading(true);
    try {
      await loadGoogleEvents();
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [timeMin, timeMax, isConnected]);

  const events = useMemo(() => {
    const all = [...googleEvents];
    all.sort((a, b) => {
      if (a.dateStr !== b.dateStr) return a.dateStr.localeCompare(b.dateStr);
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });
    return all;
  }, [googleEvents]);

  return { events, isLoading, refresh };
}
