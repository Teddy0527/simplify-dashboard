import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEventAsync } from '@jobsimplify/shared';
import type { EventType } from '@jobsimplify/shared';

const PATH_TO_EVENT: Record<string, EventType> = {
  '/': 'page_view.tracker',
  '/es': 'page_view.es',
  '/profile': 'page_view.profile',
  '/deadlines': 'page_view.deadlines',
};

export function usePageTracking(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    const eventType = PATH_TO_EVENT[pathname];
    if (eventType) {
      trackEventAsync(eventType);
    }
  }, [pathname]);
}
