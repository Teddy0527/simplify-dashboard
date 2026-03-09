import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabase, upsertCachedEmails, updateLastSync, getAliasesByMasterIds } from '@jobsimplify/shared';
import type { Company, GmailSettings } from '@jobsimplify/shared';
import { useAuth } from '../shared/hooks/useAuth';
import { syncEmails, fetchGmailProfile } from '../services/gmailSyncService';
import type { SyncDiagnostics } from '../services/gmailSyncService';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const POPUP_POLL_INTERVAL_MS = 500;
const POPUP_MAX_WAIT_MS = 2 * 60 * 1000;

export interface SyncResult {
  success: boolean;
  emailCount: number;
  error?: string;
  connectedEmail?: string;
  diagnostics?: SyncDiagnostics;
}

interface UseGmailReturn {
  isConnected: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  syncProgress: { fetched: number; total: number } | null;
  connect: () => void;
  disconnect: () => Promise<void>;
  getAccessToken: () => Promise<string>;
  sync: (companies: Company[]) => Promise<SyncResult>;
  settings: GmailSettings | null;
}

export function useGmail(): UseGmailReturn {
  const { user, session } = useAuth();
  const [settings, setSettings] = useState<GmailSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ fetched: number; total: number } | null>(null);
  const refreshPromiseRef = useRef<Promise<string> | null>(null);
  const popupPollRef = useRef<number | null>(null);

  const loadSettings = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data } = await getSupabase()
        .from('user_gmail_settings')
        .select('id, user_id, is_connected, connected_at, last_sync_at, last_history_id, google_token_expires_at')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setSettings({
          id: data.id,
          userId: data.user_id,
          isConnected: data.is_connected,
          connectedAt: data.connected_at,
          lastSyncAt: data.last_sync_at,
          lastHistoryId: data.last_history_id,
          googleTokenExpiresAt: data.google_token_expires_at,
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
      // fallback
    }

    function handleMessage(event: MessageEvent) {
      if (!allowedOrigins.has(event.origin)) return;
      if (event.data?.type === 'gmail-connected') {
        stopPopupPolling();
        loadSettings();
        return;
      }
      if (event.data?.type === 'gmail-error') {
        stopPopupPolling();
        console.error('Gmail OAuth error:', event.data?.error ?? 'Unknown error');
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

    fetch(`${SUPABASE_URL}/functions/v1/gmail-auth`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'start', app_origin: window.location.origin }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error ?? `gmail-auth failed (${res.status})`);
        }
        return data;
      })
      .then((data) => {
        if (!data.authUrl) {
          throw new Error('Missing authUrl in gmail-auth response');
        }

        const w = 500;
        const h = 600;
        const left = window.screenX + (window.outerWidth - w) / 2;
        const top = window.screenY + (window.outerHeight - h) / 2;
        const popup = window.open(
          data.authUrl,
          'gmail-auth',
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
        console.error('Failed to start Gmail OAuth:', error);
      });
  }, [session, loadSettings, stopPopupPolling]);

  const disconnect = useCallback(async () => {
    if (!session?.access_token) return;

    await fetch(`${SUPABASE_URL}/functions/v1/gmail-auth`, {
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
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    // Check if current token is still valid (with 5 min buffer)
    if (settings?.googleTokenExpiresAt) {
      const expiresAt = new Date(settings.googleTokenExpiresAt).getTime();
      if (Date.now() < expiresAt - 5 * 60 * 1000) {
        const { data } = await getSupabase()
          .from('user_gmail_settings')
          .select('google_access_token')
          .eq('user_id', user!.id)
          .single();
        if (data?.google_access_token) return data.google_access_token;
      }
    }

    const refreshPromise = (async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/gmail-auth`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session!.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'refresh' }),
        });
        const data = await res.json();
        if (data.disconnected) {
          setSettings((prev) => (prev ? { ...prev, isConnected: false } : prev));
          throw new Error('Gmail disconnected — token revoked');
        }
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

  const sync = useCallback(async (companies: Company[]): Promise<SyncResult> => {
    if (isSyncing) return { success: false, emailCount: 0, error: '同期中です' };
    setIsSyncing(true);
    setSyncProgress(null);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        return { success: false, emailCount: 0, error: 'アクセストークンを取得できませんでした。設定ページでGmailを再接続してください。' };
      }

      // Verify token validity and get connected account info
      const profile = await fetchGmailProfile(accessToken);
      if (!profile) {
        return { success: false, emailCount: 0, error: 'Gmailトークンが無効です。設定ページでGmailを再接続してください。' };
      }

      // Build alias map for classification
      const masterIds = companies
        .map((c) => c.companyMasterId)
        .filter((id): id is string => !!id);
      let aliasMap = new Map<string, string[]>();
      if (masterIds.length > 0) {
        try {
          aliasMap = await getAliasesByMasterIds(masterIds);
        } catch {
          // Non-critical — classification still works with company names only
        }
      }

      const result = await syncEmails(
        accessToken,
        user!.id,
        companies,
        (fetched, total) => setSyncProgress({ fetched, total }),
        aliasMap,
      );

      if (result.emails.length > 0) {
        await upsertCachedEmails(result.emails);
      }

      if (result.historyId) {
        await updateLastSync(result.historyId);
      }

      // Update lastSyncAt locally on success
      setSettings(prev => prev ? { ...prev, lastSyncAt: new Date().toISOString() } : prev);

      return { success: true, emailCount: result.emails.length, connectedEmail: profile.emailAddress, diagnostics: result.diagnostics };
    } catch (error) {
      console.error('[Gmail Sync] 同期中にエラーが発生しました:', error);
      const message = error instanceof Error ? error.message : '同期に失敗しました';
      return { success: false, emailCount: 0, error: message };
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  }, [isSyncing, getAccessToken, user]);

  return {
    isConnected: settings?.isConnected ?? false,
    isLoading,
    isSyncing,
    syncProgress,
    connect,
    disconnect,
    getAccessToken,
    sync,
    settings,
  };
}
