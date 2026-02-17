import { useEffect, useRef } from 'react';
import { isNewSession, getLastActivityTs, trackEventAsync } from '@jobsimplify/shared';

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Tracks session.start (once per session) and session.heartbeat (every 5min while tab is visible).
 */
export function useSessionTracking(): void {
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartedRef = useRef(false);

  useEffect(() => {
    // Fire session.start once per session
    if (!sessionStartedRef.current && isNewSession()) {
      sessionStartedRef.current = true;
      const lastTs = getLastActivityTs();
      const daysSinceLastSession = lastTs
        ? Math.round((Date.now() - lastTs) / (1000 * 60 * 60 * 24))
        : undefined;
      trackEventAsync('session.start', { daysSinceLastSession });
    }

    // Heartbeat every 5 minutes while tab is visible
    function startHeartbeat() {
      if (heartbeatRef.current) return;
      heartbeatRef.current = setInterval(() => {
        if (!document.hidden) {
          trackEventAsync('session.heartbeat', {
            durationSec: Math.round(HEARTBEAT_INTERVAL_MS / 1000),
            currentPage: window.location.pathname,
          });
        }
      }, HEARTBEAT_INTERVAL_MS);
    }

    function stopHeartbeat() {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    }

    function handleVisibility() {
      if (document.hidden) {
        stopHeartbeat();
      } else {
        startHeartbeat();
      }
    }

    startHeartbeat();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopHeartbeat();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
}
