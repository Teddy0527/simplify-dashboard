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

    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const TEST_EMAIL = 'k.hayashida.king@gmail.com';
    const RESET_KEY = 'test_user_reset_session';

    // 起動時にセッション取得
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // localhost起動時: テストアカウントならデータをリセットして初回ユーザー状態に戻す
      // sessionStorageで同一タブセッション中の重複リセットを防止
      if (isLocalhost && session?.user?.email === TEST_EMAIL && !sessionStorage.getItem(RESET_KEY)) {
        sessionStorage.setItem(RESET_KEY, '1');
        await getSupabase().rpc('reset_test_user', { target_user_id: session.user.id });
        localStorage.removeItem('onboarding_checklist_v3');
        localStorage.removeItem('welcome_shown_v2');
        window.location.reload();
        return;
      }
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
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await getSupabase().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
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
