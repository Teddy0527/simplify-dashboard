import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../shared/hooks/useAuth';
import { getSupabase } from '@jobsimplify/shared';

/**
 * 新規ユーザーをオンボーディングウィザードにリダイレクトするガード。
 * - 未ログインユーザー → /onboarding へリダイレクト
 * - onboarding_status が completed / skipped 以外 → /onboarding へ
 */
export function useOnboardingGuard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/onboarding', { replace: true });
      setChecking(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const { data: profile } = await getSupabase()
        .from('profiles')
        .select('onboarding_status, onboarding_version')
        .eq('id', user.id)
        .single();

      if (cancelled) return;

      const status = profile?.onboarding_status;
      const version = profile?.onboarding_version ?? 0;
      if (status !== 'completed' && status !== 'skipped' && !(status === 'started' && version >= 2)) {
        navigate('/onboarding', { replace: true });
      }
      setChecking(false);
    })();

    return () => { cancelled = true; };
  }, [user, authLoading, navigate, location.pathname]);

  return { checking: authLoading || checking };
}
