import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabase } from '@jobsimplify/shared';
import { useAuth } from '../shared/hooks/useAuth';
import type { CalendarSettings } from '../types/googleCalendar';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const POPUP_POLL_INTERVAL_MS = 500;
const POPUP_MAX_WAIT_MS = 2 * 60 * 1000;

interface UseGoogleCalendarReturn {
  isConnected: boolean;
  isLoading: boolean;
  isTestUserApproved: boolean;
  connect: () => void;
  disconnect: () => Promise<void>;
  getAccessToken: () => Promise<string>;
  calendarId: string | null;
  settings: CalendarSettings | null;
  googleEmail: string | null;
}

export function useGoogleCalendar(): UseGoogleCalendarReturn {
  const { user, session } = useAuth();
  const [settings, setSettings] = useState<CalendarSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshPromiseRef = useRef<Promise<string> | null>(null);
  const popupPollRef = useRef<number | null>(null);

  const loadSettings = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data } = await getSupabase()
        .from('user_calendar_settings')
        .select('id, user_id, is_connected, calendar_id, connected_at, google_token_expires_at, google_email, is_test_user_approved')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setSettings({
          id: data.id,
          userId: data.user_id,
          isConnected: data.is_connected,
          isTestUserApproved: data.is_test_user_approved ?? false,
          calendarId: data.calendar_id,
          connectedAt: data.connected_at,
          googleTokenExpiresAt: data.google_token_expires_at,
          googleEmail: data.google_email ?? null,
        });
      } else {
        setSettings(null);
      }
    } catch {
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load settings on mount
  useEffect(() => {
    if (!user) {
      setSettings(null);
      setIsLoading(false);
      return;
    }
    loadSettings();
  }, [user, loadSettings]);

  const stopPopupPolling = useCallback(() => {
    if (popupPollRef.current !== null) {
      window.clearInterval(popupPollRef.current);
      popupPollRef.current = null;
    }
  }, []);

  // Listen for postMessage from OAuth popup
  useEffect(() => {
    const allowedOrigins = new Set<string>([window.location.origin]);
    try {
      allowedOrigins.add(new URL(SUPABASE_URL).origin);
    } catch {
      // Ignore invalid SUPABASE_URL and fallback to same-origin only.
    }

    function handleMessage(event: MessageEvent) {
      if (!allowedOrigins.has(event.origin)) return;
      if (event.data?.type === 'google-calendar-connected') {
        stopPopupPolling();
        loadSettings();
        return;
      }
      if (event.data?.type === 'google-calendar-error') {
        stopPopupPolling();
        console.error('Google Calendar OAuth error:', event.data?.error ?? 'Unknown error');
        loadSettings();
      }
    }
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      stopPopupPolling();
    };
  }, [loadSettings, stopPopupPolling]);

  const connect = useCallback(() => {
    if (!session?.access_token) return;

    const payload: Record<string, string> = {
      action: 'start',
      app_origin: window.location.origin,
    };
    try {
      payload.redirect_uri = new URL('/functions/v1/google-calendar-auth/callback', SUPABASE_URL).toString();
    } catch {
      // Ignore invalid SUPABASE_URL and let backend use default redirect_uri.
    }

    fetch(`${SUPABASE_URL}/functions/v1/google-calendar-auth`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error ?? `google-calendar-auth failed (${res.status})`);
        }
        return data;
      })
      .then((data) => {
        if (!data.authUrl) {
          throw new Error('Missing authUrl in google-calendar-auth response');
        }

        const w = 500;
        const h = 600;
        const left = window.screenX + (window.outerWidth - w) / 2;
        const top = window.screenY + (window.outerHeight - h) / 2;
        const popup = window.open(
          data.authUrl,
          'google-calendar-auth',
          `width=${w},height=${h},left=${left},top=${top}`,
        );

        if (!popup) {
          throw new Error('Popup blocked');
        }

        stopPopupPolling();
        const startedAt = Date.now();
        popupPollRef.current = window.setInterval(() => {
          if (popup.closed || Date.now() - startedAt > POPUP_MAX_WAIT_MS) {
            stopPopupPolling();
            loadSettings();
          }
        }, POPUP_POLL_INTERVAL_MS);
      })
      .catch((error) => {
        console.error('Failed to start Google Calendar OAuth:', error);
      });
  }, [session, loadSettings, stopPopupPolling]);

  const disconnect = useCallback(async () => {
    if (!session?.access_token) return;

    await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-auth`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'disconnect' }),
    });

    setSettings(null);
  }, [session]);

  const getAccessToken = useCallback(async (): Promise<string> => {
    // Use promise lock to prevent concurrent refresh requests
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    // Check if current token is still valid (with 5 min buffer)
    if (settings?.googleTokenExpiresAt) {
      const expiresAt = new Date(settings.googleTokenExpiresAt).getTime();
      if (Date.now() < expiresAt - 5 * 60 * 1000) {
        // Token still valid, fetch it from DB
        const { data } = await getSupabase()
          .from('user_calendar_settings')
          .select('google_access_token')
          .eq('user_id', user!.id)
          .single();
        if (data?.google_access_token) return data.google_access_token;
      }
    }

    // Need to refresh
    const refreshPromise = (async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-auth`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session!.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'refresh' }),
        });
        const data = await res.json();
        if (data.access_token) {
          setSettings((prev) =>
            prev ? { ...prev, googleTokenExpiresAt: data.expires_at } : prev,
          );
          return data.access_token as string;
        }
        throw new Error('Failed to refresh token');
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, [settings, user, session]);

  return {
    isConnected: settings?.isConnected ?? false,
    isLoading,
    isTestUserApproved: settings?.isTestUserApproved ?? false,
    connect,
    disconnect,
    getAccessToken,
    calendarId: settings?.calendarId ?? null,
    settings,
    googleEmail: settings?.googleEmail ?? null,
  };
}
