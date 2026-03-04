import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabase } from '@jobsimplify/shared';
import type { Company, CompanyDeadline } from '@jobsimplify/shared';
import { DEADLINE_TYPE_LABELS } from '@jobsimplify/shared';
import { useGoogleCalendar } from './useGoogleCalendar';
import { useAuth } from '../shared/hooks/useAuth';
import * as gcalApi from '../utils/googleCalendarApi';
import { getReminderOverrides } from '../utils/reminderPresets';
import { DEADLINE_EMOJI } from '../utils/deadlineHelpers';
import type { GCalEventPayload } from '../types/googleCalendar';

/** Maximum number of pending queue items to process per retry batch */
const RETRY_QUEUE_FETCH_LIMIT = 10;
/** Default maximum retry attempts before marking a sync item as failed */
const DEFAULT_MAX_RETRIES = 3;
/** Base interval (ms) for exponential backoff between retries */
const RETRY_BASE_INTERVAL_MS = 60_000;

function buildGCalEventPayload(company: Company, deadline: CompanyDeadline, appUrl?: string): GCalEventPayload {
  const emoji = DEADLINE_EMOJI[deadline.type] || '📌';
  const typeLabel = DEADLINE_TYPE_LABELS[deadline.type] || deadline.type;
  const summary = `${emoji} ${typeLabel} ${company.name}`;

  let description = 'Simplifyで管理中';
  if (appUrl) description += `\n🔗 ${appUrl}`;
  if (deadline.memo) description += `\n📋 メモ: ${deadline.memo}`;

  let start: GCalEventPayload['start'];
  let end: GCalEventPayload['end'];

  if (deadline.time) {
    const startDt = `${deadline.date}T${deadline.time}:00+09:00`;
    const [h, m] = deadline.time.split(':').map(Number);
    const endH = h + 1;
    const endTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    start = { dateTime: startDt, timeZone: 'Asia/Tokyo' };
    end = { dateTime: `${deadline.date}T${endTime}:00+09:00`, timeZone: 'Asia/Tokyo' };
  } else {
    start = { date: deadline.date };
    const nextDay = new Date(deadline.date);
    nextDay.setDate(nextDay.getDate() + 1);
    const endDate = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
    end = { date: endDate };
  }

  return {
    summary,
    description,
    start,
    end,
    reminders: {
      useDefault: false,
      overrides: getReminderOverrides(deadline.type),
    },
  };
}

interface UseCalendarSyncReturn {
  syncDeadlineChanges: (
    oldDeadlines: CompanyDeadline[],
    newDeadlines: CompanyDeadline[],
    company: Company,
    applicationId: string,
  ) => Promise<void>;
  syncSingleDeadline: (company: Company, deadline: CompanyDeadline, appId: string) => Promise<void>;
  unsyncSingleDeadline: (appId: string, deadlineId: string) => Promise<void>;
  syncedDeadlineIds: Set<string>;
  pendingQueueCount: number;
  retryPendingQueue: () => Promise<void>;
}

export function useCalendarSync(): UseCalendarSyncReturn {
  const { user } = useAuth();
  const { isConnected, getAccessToken, calendarId } = useGoogleCalendar();
  const [syncedDeadlineIds, setSyncedDeadlineIds] = useState<Set<string>>(new Set());
  const [pendingQueueCount, setPendingQueueCount] = useState(0);
  const syncedRef = useRef(syncedDeadlineIds);
  syncedRef.current = syncedDeadlineIds;

  // Load synced deadline IDs on mount
  useEffect(() => {
    if (!user || !isConnected) return;
    getSupabase()
      .from('calendar_sync_events')
      .select('deadline_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          setSyncedDeadlineIds(new Set(data.map((d) => d.deadline_id)));
        }
      });
    // Check pending queue
    getSupabase()
      .from('calendar_sync_queue')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .then(({ count }) => {
        setPendingQueueCount(count ?? 0);
      });
  }, [user, isConnected]);

  const enqueueFailedSync = useCallback(
    async (appId: string, deadlineId: string, action: 'create' | 'update' | 'delete', payload: GCalEventPayload | null, error: string) => {
      if (!user) return;
      await getSupabase().from('calendar_sync_queue').insert({
        user_id: user.id,
        application_id: appId,
        deadline_id: deadlineId,
        action,
        payload,
        error_message: error,
      });
      setPendingQueueCount((c) => c + 1);
    },
    [user],
  );

  const syncDeadlineChanges = useCallback(
    async (
      oldDeadlines: CompanyDeadline[],
      newDeadlines: CompanyDeadline[],
      company: Company,
      applicationId: string,
    ) => {
      if (!isConnected || !calendarId || !user) return;

      const oldMap = new Map(oldDeadlines.map((d) => [d.id, d]));
      const newMap = new Map(newDeadlines.map((d) => [d.id, d]));

      let token: string;
      try {
        token = await getAccessToken();
      } catch {
        // Queue all changes for retry
        for (const dl of newDeadlines) {
          if (!oldMap.has(dl.id)) {
            await enqueueFailedSync(applicationId, dl.id, 'create', buildGCalEventPayload(company, dl), 'Token unavailable');
          }
        }
        return;
      }

      // Detect added deadlines
      for (const [id, dl] of newMap) {
        if (!oldMap.has(id)) {
          try {
            const payload = buildGCalEventPayload(company, dl);
            const eventId = await gcalApi.createEvent(token, calendarId, payload);
            await getSupabase().from('calendar_sync_events').insert({
              user_id: user.id,
              application_id: applicationId,
              deadline_id: id,
              google_event_id: eventId,
              calendar_id: calendarId,
            });
            setSyncedDeadlineIds((prev) => new Set([...prev, id]));
          } catch (e) {
            await enqueueFailedSync(applicationId, id, 'create', buildGCalEventPayload(company, dl), String(e));
          }
        }
      }

      // Detect changed deadlines
      for (const [id, newDl] of newMap) {
        const oldDl = oldMap.get(id);
        if (!oldDl) continue;
        const changed = oldDl.date !== newDl.date || oldDl.time !== newDl.time || oldDl.label !== newDl.label || oldDl.memo !== newDl.memo || oldDl.type !== newDl.type;
        if (!changed) continue;
        if (!syncedRef.current.has(id)) continue;

        try {
          const { data: syncEvent } = await getSupabase()
            .from('calendar_sync_events')
            .select('google_event_id')
            .eq('user_id', user.id)
            .eq('deadline_id', id)
            .single();
          if (syncEvent) {
            const payload = buildGCalEventPayload(company, newDl);
            await gcalApi.updateEvent(token, calendarId, syncEvent.google_event_id, payload);
          }
        } catch (e) {
          await enqueueFailedSync(applicationId, id, 'update', buildGCalEventPayload(company, newDl), String(e));
        }
      }

      // Detect deleted deadlines
      for (const [id] of oldMap) {
        if (!newMap.has(id) && syncedRef.current.has(id)) {
          try {
            const { data: syncEvent } = await getSupabase()
              .from('calendar_sync_events')
              .select('google_event_id')
              .eq('user_id', user.id)
              .eq('deadline_id', id)
              .single();
            if (syncEvent) {
              await gcalApi.deleteEvent(token, calendarId, syncEvent.google_event_id);
              await getSupabase().from('calendar_sync_events').delete().eq('deadline_id', id).eq('user_id', user.id);
              setSyncedDeadlineIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
            }
          } catch (e) {
            await enqueueFailedSync(applicationId, id, 'delete', null, String(e));
          }
        }
      }
    },
    [isConnected, calendarId, user, getAccessToken, enqueueFailedSync],
  );

  const syncSingleDeadline = useCallback(
    async (company: Company, deadline: CompanyDeadline, appId: string) => {
      if (!isConnected || !calendarId || !user) return;
      const token = await getAccessToken();
      const payload = buildGCalEventPayload(company, deadline);
      const eventId = await gcalApi.createEvent(token, calendarId, payload);
      await getSupabase().from('calendar_sync_events').insert({
        user_id: user.id,
        application_id: appId,
        deadline_id: deadline.id,
        google_event_id: eventId,
        calendar_id: calendarId,
      });
      setSyncedDeadlineIds((prev) => new Set([...prev, deadline.id]));
    },
    [isConnected, calendarId, user, getAccessToken],
  );

  const unsyncSingleDeadline = useCallback(
    async (_appId: string, deadlineId: string) => {
      if (!isConnected || !calendarId || !user) return;
      const token = await getAccessToken();
      const { data: syncEvent } = await getSupabase()
        .from('calendar_sync_events')
        .select('google_event_id')
        .eq('user_id', user.id)
        .eq('deadline_id', deadlineId)
        .single();
      if (syncEvent) {
        await gcalApi.deleteEvent(token, calendarId, syncEvent.google_event_id);
        await getSupabase().from('calendar_sync_events').delete().eq('deadline_id', deadlineId).eq('user_id', user.id);
        setSyncedDeadlineIds((prev) => { const next = new Set(prev); next.delete(deadlineId); return next; });
      }
    },
    [isConnected, calendarId, user, getAccessToken],
  );

  const retryPendingQueue = useCallback(async () => {
    if (!user || !isConnected || !calendarId) return;
    const { data: items } = await getSupabase()
      .from('calendar_sync_queue')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(RETRY_QUEUE_FETCH_LIMIT);
    if (!items || items.length === 0) return;

    let token: string;
    try {
      token = await getAccessToken();
    } catch {
      return;
    }

    for (const item of items) {
      try {
        await getSupabase().from('calendar_sync_queue').update({ status: 'processing' }).eq('id', item.id);

        if (item.action === 'create' && item.payload) {
          const eventId = await gcalApi.createEvent(token, calendarId, item.payload);
          await getSupabase().from('calendar_sync_events').insert({
            user_id: user.id,
            application_id: item.application_id,
            deadline_id: item.deadline_id,
            google_event_id: eventId,
            calendar_id: calendarId,
          });
          setSyncedDeadlineIds((prev) => new Set([...prev, item.deadline_id]));
        } else if (item.action === 'update' && item.payload) {
          const { data: syncEvent } = await getSupabase()
            .from('calendar_sync_events')
            .select('google_event_id')
            .eq('user_id', user.id)
            .eq('deadline_id', item.deadline_id)
            .single();
          if (syncEvent) {
            await gcalApi.updateEvent(token, calendarId, syncEvent.google_event_id, item.payload);
          }
        } else if (item.action === 'delete') {
          const { data: syncEvent } = await getSupabase()
            .from('calendar_sync_events')
            .select('google_event_id')
            .eq('user_id', user.id)
            .eq('deadline_id', item.deadline_id)
            .single();
          if (syncEvent) {
            await gcalApi.deleteEvent(token, calendarId, syncEvent.google_event_id);
            await getSupabase().from('calendar_sync_events').delete().eq('deadline_id', item.deadline_id).eq('user_id', user.id);
          }
        }

        await getSupabase().from('calendar_sync_queue').update({ status: 'completed' }).eq('id', item.id);
        setPendingQueueCount((c) => Math.max(0, c - 1));
      } catch (e) {
        const newRetry = (item.retry_count || 0) + 1;
        const status = newRetry >= (item.max_retries || DEFAULT_MAX_RETRIES) ? 'failed' : 'pending';
        await getSupabase().from('calendar_sync_queue').update({
          status,
          retry_count: newRetry,
          error_message: String(e),
          next_retry_at: new Date(Date.now() + RETRY_BASE_INTERVAL_MS * Math.pow(2, newRetry)).toISOString(),
        }).eq('id', item.id);
        if (status === 'failed') setPendingQueueCount((c) => Math.max(0, c - 1));
      }
    }
  }, [user, isConnected, calendarId, getAccessToken]);

  // Auto-retry on mount
  useEffect(() => {
    if (isConnected && pendingQueueCount > 0) {
      retryPendingQueue();
    }
  }, [isConnected, pendingQueueCount > 0]);

  return {
    syncDeadlineChanges,
    syncSingleDeadline,
    unsyncSingleDeadline,
    syncedDeadlineIds,
    pendingQueueCount,
    retryPendingQueue,
  };
}
