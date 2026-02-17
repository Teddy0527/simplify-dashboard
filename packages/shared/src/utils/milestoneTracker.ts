import { trackEventAsync } from '../repositories/eventRepository';
import type { EventType } from '../types/userEvent';

const MILESTONE_PREFIX = 'simplify_milestone_';

/**
 * Fire a milestone event only once per user (persisted in localStorage).
 */
export function trackMilestoneOnce(
  milestone: Extract<EventType, `milestone.${string}`>,
  metadata?: Record<string, unknown>,
): void {
  const key = MILESTONE_PREFIX + milestone;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, new Date().toISOString());
  } catch {
    // localStorage unavailable — skip dedup, still fire
  }
  trackEventAsync(milestone, { ...metadata, triggeredBy: milestone.split('.')[1] });
}

/**
 * Check if a milestone has already been achieved.
 */
export function isMilestoneAchieved(
  milestone: Extract<EventType, `milestone.${string}`>,
): boolean {
  try {
    return !!localStorage.getItem(MILESTONE_PREFIX + milestone);
  } catch {
    return false;
  }
}
