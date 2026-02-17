import { trackEventAsync } from '../repositories/eventRepository';
import type { EventType } from '../types/userEvent';

const timers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Debounced version of trackEventAsync.
 * Groups rapid-fire events (e.g. filter/search) into a single event.
 * @param eventType - The event type to track
 * @param metadata  - Event metadata
 * @param delayMs   - Debounce delay (default 5000ms)
 */
export function trackEventDebounced(
  eventType: EventType,
  metadata?: Record<string, unknown>,
  delayMs = 5000,
): void {
  const key = eventType;
  const existing = timers.get(key);
  if (existing) clearTimeout(existing);

  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      trackEventAsync(eventType, metadata);
    }, delayMs),
  );
}
