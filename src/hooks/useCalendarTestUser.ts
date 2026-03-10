import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@jobsimplify/shared';
import { useAuth } from '../shared/hooks/useAuth';

type RequestStatus = 'none' | 'pending' | 'approved' | 'rejected';

interface UseCalendarTestUserReturn {
  status: RequestStatus;
  isLoading: boolean;
  apply: () => Promise<void>;
}

export function useCalendarTestUser(): UseCalendarTestUserReturn {
  const { user } = useAuth();
  const [status, setStatus] = useState<RequestStatus>('none');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    Promise.resolve(
      getSupabase()
        .from('calendar_test_user_requests')
        .select('status')
        .eq('user_id', user.id)
        .single()
    )
      .then(({ data }) => {
        if (data?.status) {
          setStatus(data.status as RequestStatus);
        } else {
          setStatus('none');
        }
      })
      .finally(() => setIsLoading(false));
  }, [user]);

  const apply = useCallback(async () => {
    if (!user) return;

    const { error } = await getSupabase()
      .from('calendar_test_user_requests')
      .insert({
        user_id: user.id,
        user_email: user.email ?? '',
        user_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      });

    if (!error) {
      setStatus('pending');
    }
  }, [user]);

  return { status, isLoading, apply };
}
