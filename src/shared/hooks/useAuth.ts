import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { migrateLocalToCloud } from '../services/dataMigration';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function useAuthProvider(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 起動時にセッション取得
    chrome.runtime.sendMessage({ type: 'GET_SESSION' }, (response) => {
      if (response?.session) {
        setSession(response.session);
        setUser(response.session.user);
      }
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(async () => {
    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({ type: 'SIGN_IN' });
      if (response?.error) {
        throw new Error(response.error);
      }
      setUser(response.user);
      setSession(response.session);
      // 初回ログイン時にローカルデータをクラウドに移行
      migrateLocalToCloud().catch(console.error);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({ type: 'SIGN_OUT' });
      if (response?.error) {
        throw new Error(response.error);
      }
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, session, loading, signIn, signOut };
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
