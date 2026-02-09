import { useState, useEffect, useCallback } from 'react';
import {
  getTemplates,
  addTemplate as addRepo,
  updateTemplate as updateRepo,
  deleteTemplate as deleteRepo,
} from '@entrify/shared';
import type { Template } from '@entrify/shared';
import { useAuth } from './useAuth';

export function useTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(async (template: Template) => {
    await addRepo(template);
    await load();
  }, [load]);

  const update = useCallback(async (template: Template) => {
    await updateRepo(template);
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    await deleteRepo(id);
    await load();
  }, [load]);

  return { templates, loading, error, add, update, remove, reload: load };
}
