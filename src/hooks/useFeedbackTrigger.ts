import { useState, useEffect, useCallback, useRef } from 'react';
import { getSessionId, trackEventAsync, submitFeedback } from '@jobsimplify/shared';

const STORAGE_KEYS = {
  sessionCount: 'feedback_session_count',
  lastInteractionTs: 'feedback_last_interaction_ts',
  optedOut: 'feedback_opted_out',
  lastSessionId: 'feedback_last_session_id',
} as const;

const MIN_SESSIONS = 5;
const SNOOZE_DAYS = 14;
const SHOW_DELAY_MS = 3000;

export interface FeedbackTrigger {
  shouldShow: boolean;
  onSubmit: (params: {
    rating: number;
    satisfaction?: string;
    complaints?: string;
    featureRequests?: string;
  }) => Promise<void>;
  onSnooze: () => void;
  onOptOut: () => void;
}

export function useFeedbackTrigger(): FeedbackTrigger {
  const [shouldShow, setShouldShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Increment session count using getSessionId() comparison
    const currentSid = getSessionId();
    const lastSid = localStorage.getItem(STORAGE_KEYS.lastSessionId);
    if (currentSid !== lastSid) {
      localStorage.setItem(STORAGE_KEYS.lastSessionId, currentSid);
      const count = Number(localStorage.getItem(STORAGE_KEYS.sessionCount) || '0');
      localStorage.setItem(STORAGE_KEYS.sessionCount, String(count + 1));
    }

    // Check display conditions
    if (localStorage.getItem(STORAGE_KEYS.optedOut) === '1') return;

    const sessionCount = Number(localStorage.getItem(STORAGE_KEYS.sessionCount) || '0');
    if (sessionCount < MIN_SESSIONS) return;

    const lastInteraction = Number(localStorage.getItem(STORAGE_KEYS.lastInteractionTs) || '0');
    if (lastInteraction > 0) {
      const daysSince = (Date.now() - lastInteraction) / (1000 * 60 * 60 * 24);
      if (daysSince < SNOOZE_DAYS) return;
    }

    // Check WelcomeModal has been dismissed
    if (!localStorage.getItem('welcome_shown_v2')) return;

    // Check onboarding is not still active (if key doesn't exist, onboarding may be in progress)
    // Only block if onboarding was started but not completed
    const onboardingState = localStorage.getItem('onboarding_checklist_v3');
    if (onboardingState) {
      try {
        const parsed = JSON.parse(onboardingState);
        if (parsed && !parsed.dismissed) return;
      } catch {
        // ignore parse errors
      }
    }

    // Show after delay
    timerRef.current = setTimeout(() => {
      setShouldShow(true);
      trackEventAsync('feedback.prompt_shown');
    }, SHOW_DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const recordInteraction = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.lastInteractionTs, String(Date.now()));
    setShouldShow(false);
  }, []);

  const onSubmit = useCallback(
    async (params: {
      rating: number;
      satisfaction?: string;
      complaints?: string;
      featureRequests?: string;
    }) => {
      await submitFeedback(params);

      const hasText = params.satisfaction || params.complaints || params.featureRequests;
      trackEventAsync(hasText ? 'feedback.submitted' : 'feedback.skipped_text', {
        rating: params.rating,
      });

      recordInteraction();
    },
    [recordInteraction],
  );

  const onSnooze = useCallback(() => {
    trackEventAsync('feedback.snoozed');
    recordInteraction();
  }, [recordInteraction]);

  const onOptOut = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.optedOut, '1');
    trackEventAsync('feedback.opted_out');
    setShouldShow(false);
  }, []);

  return { shouldShow, onSubmit, onSnooze, onOptOut };
}
