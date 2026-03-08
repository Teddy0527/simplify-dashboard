import { usePostHog } from 'posthog-js/react';
import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribe to a PostHog feature flag value.
 */
export function useFlag(key: string): boolean | string | undefined {
  const posthog = usePostHog();

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return posthog.onFeatureFlags(onStoreChange);
    },
    [posthog],
  );

  const getSnapshot = useCallback(() => {
    return posthog.getFeatureFlag(key);
  }, [posthog, key]);

  return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * Get the JSON payload attached to a feature flag.
 */
export function useFlagPayload(key: string): unknown {
  const posthog = usePostHog();

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return posthog.onFeatureFlags(onStoreChange);
    },
    [posthog],
  );

  const getSnapshot = useCallback(() => {
    return posthog.getFeatureFlagPayload(key);
  }, [posthog, key]);

  return useSyncExternalStore(subscribe, getSnapshot);
}
