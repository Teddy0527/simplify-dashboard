import { getSupabase, getCurrentUser } from '../lib/supabase';
import type { EventType, EventCategory } from '../types/userEvent';
import { getSessionId } from '../utils/sessionManager';

export type EventTrackingListener = (eventType: EventType, metadata?: Record<string, unknown>) => void;

let _onTrack: EventTrackingListener | null = null;

/**
 * Register a listener that is called whenever an event is tracked.
 * Used by the dashboard to forward events to PostHog without
 * adding PostHog as a dependency in the shared package.
 */
export function setEventTrackingListener(listener: EventTrackingListener): void {
  _onTrack = listener;
}

function getCategoryFromType(eventType: EventType): EventCategory {
  return eventType.split('.')[0] as EventCategory;
}

/**
 * Track a user event asynchronously (fire-and-forget).
 * Silently skips if the user is not authenticated.
 */
export function trackEventAsync(eventType: EventType, metadata?: Record<string, unknown>): void {
  trackEvent(eventType, metadata).catch(() => {});
}

/**
 * Track a user event. Returns a promise for cases where you need to await.
 * Automatically injects sessionId into metadata.
 */
export async function trackEvent(eventType: EventType, metadata?: Record<string, unknown>): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const enrichedMetadata = {
    sessionId: getSessionId(),
    ...metadata,
  };

  const { error } = await getSupabase()
    .from('user_events')
    .insert({
      user_id: user.id,
      event_type: eventType,
      event_category: getCategoryFromType(eventType),
      metadata: enrichedMetadata,
    });

  if (error) {
    console.error('[EventTracking] Failed to track event:', {
      eventType,
      error: error.message,
    });
  }

  try {
    _onTrack?.(eventType, enrichedMetadata);
  } catch {
    // Listener errors must not break event tracking
  }
}
