import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@jobsimplify/shared';
import type { DeadlinePresetWithCompany } from '@jobsimplify/shared';
import { useAuth } from '../shared/hooks/useAuth';
import { getStoredToken } from './useGoogleCalendar';
import { presetToCalendarEvent } from '../utils/googleCalendar';
import { createCalendarEvent, deleteCalendarEvent, GoogleCalendarAuthError } from '../utils/googleCalendarApi';

export interface DeadlineReminder {
  id: string;
  userId: string;
  presetId: string;
  daysBefore: number;
  remindAt: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  retryCount: number;
  failureReason?: string;
  sentAt?: string;
  calendarEventId?: string;
}

interface UseDeadlineRemindersReturn {
  reminders: DeadlineReminder[];
  loading: boolean;
  addReminder: (entry: DeadlinePresetWithCompany, daysBefore: number) => Promise<void>;
  cancelReminder: (reminderId: string) => Promise<void>;
  addBulkReminders: (entries: DeadlinePresetWithCompany[], daysBefore: number) => Promise<number>;
  hasCalendarToken: () => boolean;
  getReminderForPreset: (presetId: string, daysBefore: number) => DeadlineReminder | undefined;
}

function computeRemindAt(deadlineDate: string, daysBefore: number): string {
  const d = new Date(deadlineDate + 'T00:00:00+09:00');
  d.setDate(d.getDate() - daysBefore);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

export function useDeadlineReminders(): UseDeadlineRemindersReturn {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<DeadlineReminder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReminders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await getSupabase()
        .from('deadline_reminders')
        .select('*')
        .order('remind_at', { ascending: true });

      if (error) throw error;

      setReminders(
        (data || []).map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          presetId: r.preset_id,
          daysBefore: r.days_before,
          remindAt: r.remind_at,
          status: r.status,
          retryCount: r.retry_count,
          failureReason: r.failure_reason,
          sentAt: r.sent_at,
          calendarEventId: r.calendar_event_id,
        })),
      );
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const addReminder = useCallback(
    async (entry: DeadlinePresetWithCompany, daysBefore: number) => {
      if (!user) return;

      const token = getStoredToken();
      if (!token) throw new Error('No calendar token');

      const remindAt = computeRemindAt(entry.deadlineDate, daysBefore);
      let calendarEventId: string | undefined;
      let status: 'sent' | 'failed' = 'sent';
      let failureReason: string | null = null;

      try {
        const payload = presetToCalendarEvent(entry, daysBefore);
        const event = await createCalendarEvent(token, payload);
        calendarEventId = event.id;
      } catch (err) {
        if (err instanceof GoogleCalendarAuthError) {
          localStorage.removeItem('simplify:gcal-token');
        }
        throw err;
      }

      const { data, error } = await getSupabase()
        .from('deadline_reminders')
        .upsert(
          {
            user_id: user.id,
            preset_id: entry.id,
            days_before: daysBefore,
            remind_at: remindAt,
            status,
            retry_count: 0,
            failure_reason: failureReason,
            calendar_event_id: calendarEventId ?? null,
          },
          { onConflict: 'user_id,preset_id,days_before' },
        )
        .select()
        .single();

      if (error) throw error;

      setReminders((prev) => {
        const filtered = prev.filter(
          (r) => !(r.presetId === entry.id && r.daysBefore === daysBefore),
        );
        return [
          ...filtered,
          {
            id: data.id,
            userId: data.user_id,
            presetId: data.preset_id,
            daysBefore: data.days_before,
            remindAt: data.remind_at,
            status: data.status,
            retryCount: data.retry_count,
            failureReason: data.failure_reason,
            sentAt: data.sent_at,
            calendarEventId: data.calendar_event_id,
          },
        ];
      });
    },
    [user],
  );

  const cancelReminder = useCallback(
    async (reminderId: string) => {
      const reminder = reminders.find((r) => r.id === reminderId);

      // Try to delete the calendar event if we have an ID
      if (reminder?.calendarEventId) {
        const token = getStoredToken();
        if (token) {
          try {
            await deleteCalendarEvent(token, reminder.calendarEventId);
          } catch (err) {
            // Token expired — just update DB, calendar event stays
            if (!(err instanceof GoogleCalendarAuthError)) throw err;
            console.warn('Token expired, calendar event not deleted');
          }
        }
      }

      const { error } = await getSupabase()
        .from('deadline_reminders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', reminderId);

      if (error) throw error;

      setReminders((prev) =>
        prev.map((r) => (r.id === reminderId ? { ...r, status: 'cancelled' as const } : r)),
      );
    },
    [reminders],
  );

  const addBulkReminders = useCallback(
    async (entries: DeadlinePresetWithCompany[], daysBefore: number) => {
      if (!user) return 0;

      const token = getStoredToken();
      if (!token) throw new Error('No calendar token');

      const now = new Date();
      const validEntries = entries.filter((entry) => {
        const remindAt = computeRemindAt(entry.deadlineDate, daysBefore);
        return new Date(remindAt) > now;
      });

      if (validEntries.length === 0) return 0;

      let successCount = 0;
      for (const entry of validEntries) {
        try {
          await addReminder(entry, daysBefore);
          successCount++;
          // 100ms delay between API calls
          await new Promise((r) => setTimeout(r, 100));
        } catch (err) {
          if (err instanceof GoogleCalendarAuthError) throw err;
        }
      }

      await fetchReminders();
      return successCount;
    },
    [user, addReminder, fetchReminders],
  );

  const hasCalendarToken = useCallback(() => {
    return !!getStoredToken();
  }, []);

  const getReminderForPreset = useCallback(
    (presetId: string, daysBefore: number) => {
      return reminders.find(
        (r) => r.presetId === presetId && r.daysBefore === daysBefore && (r.status === 'pending' || r.status === 'sent'),
      );
    },
    [reminders],
  );

  return {
    reminders,
    loading,
    addReminder,
    cancelReminder,
    addBulkReminders,
    hasCalendarToken,
    getReminderForPreset,
  };
}
