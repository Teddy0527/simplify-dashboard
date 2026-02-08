import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkIsAdmin } from '@simplify/shared';

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkIsAdmin().then((result) => {
      setIsAdmin(result);
      setLoading(false);
      if (!result) navigate('/', { replace: true });
    });
  }, [navigate]);

  return { isAdmin, loading };
}
