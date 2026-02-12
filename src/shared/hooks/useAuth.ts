import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase, migrateLocalToCloud, trackEventAsync } from '@jobsimplify/shared';

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
    const supabase = getSupabase();

    // 起動時にセッション取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // セッション変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_IN') trackEventAsync('auth.login');
      if (_event === 'SIGNED_OUT') trackEventAsync('auth.logout');
      if (session?.provider_token) {
        localStorage.setItem('simplify:gcal-token', JSON.stringify({
          token: session.provider_token,
          expiresAt: Date.now() + 3600 * 1000,
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await getSupabase().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      // 初回ログイン時にローカルデータをクラウドに移行
      migrateLocalToCloud().catch(console.error);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await getSupabase().auth.signOut();
      if (error) throw error;
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
