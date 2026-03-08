import posthog from 'posthog-js';

export function initPostHog(): void {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST;

  if (!key) return;

  posthog.init(key, {
    api_host: host || 'https://us.i.posthog.com',
    autocapture: true,
    capture_pageview: false, // SPA: manually capture in usePageTracking
    session_recording: {
      maskAllInputs: true,
    },
    persistence: 'localStorage+cookie',
  });

  if (import.meta.env.DEV) {
    posthog.debug();
  }
}

export { posthog };
