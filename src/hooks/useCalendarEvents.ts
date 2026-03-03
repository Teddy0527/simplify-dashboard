import { useState, useEffect, useMemo } from 'react';
import { getCompanies } from '@jobsimplify/shared';
import type { DeadlineType } from '@jobsimplify/shared';
import { useGoogleCalendar } from './useGoogleCalendar';
import { listEvents, listCalendars } from '../utils/googleCalendarApi';
import { getDeadlineUrgency } from '../utils/deadlineUtils';
import type { CalendarEventDisplay } from '../types/googleCalendar';

const DEADLINE_TYPE_COLORS: Record<DeadlineType, string> = {
  es_submission: '#ea4335',
  internship: '#4285f4',
  webtest: '#fbbc05',
  interview: '#34a853',
  offer_response: '#ff6d01',
  document: '#46bdc6',
  event: '#7986cb',
  other: '#9ca3af',
};

interface UseCalendarEventsReturn {
  events: CalendarEventDisplay[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useCalendarEvents(timeMin: string, timeMax: string): UseCalendarEventsReturn {
  const { isConnected, getAccessToken, calendarId } = useGoogleCalendar();
  const [simplifyEvents, setSimplifyEvents] = useState<CalendarEventDisplay[]>([]);
  const [googleEvents, setGoogleEvents] = useState<CalendarEventDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadSimplifyDeadlines() {
    try {
      const companies = await getCompanies();
      const events: CalendarEventDisplay[] = [];

      for (const company of companies) {
        if (!company.deadlines) continue;
        for (const dl of company.deadlines) {
          if (dl.date < timeMin.slice(0, 10) || dl.date > timeMax.slice(0, 10)) continue;

          const urgency = getDeadlineUrgency(dl.date);
          // Calculate endTime: default 1 hour after startTime
          let endTime: string | undefined;
          if (dl.time) {
            const [h, m] = dl.time.split(':').map(Number);
            const endH = h + 1;
            endTime = endH < 24 ? `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}` : '23:59';
          }

          events.push({
            id: `${dl.type}-${dl.id}`,
            title: `${company.name} - ${dl.label}`,
            dateStr: dl.date,
            startTime: dl.time || undefined,
            endTime,
            isAllDay: !dl.time,
            htmlLink: `/?company=${company.id}`,
            source: 'simplify',
            companyId: company.id,
            urgency,
            color: DEADLINE_TYPE_COLORS[dl.type] || DEADLINE_TYPE_COLORS.other,
          });
        }
      }

      setSimplifyEvents(events);
    } catch (err) {
      console.error('Failed to load Simplify deadlines:', err);
    }
  }

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
      await Promise.all([loadSimplifyDeadlines(), loadGoogleEvents()]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [timeMin, timeMax, isConnected]);

  const events = useMemo(() => {
    const all = [...simplifyEvents, ...googleEvents];
    all.sort((a, b) => {
      if (a.dateStr !== b.dateStr) return a.dateStr.localeCompare(b.dateStr);
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });
    return all;
  }, [simplifyEvents, googleEvents]);

  return { events, isLoading, refresh };
}

