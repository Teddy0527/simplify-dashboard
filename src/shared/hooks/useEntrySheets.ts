import { useState, useEffect, useCallback } from 'react';
import {
  getEntrySheets,
  getEntrySheet,
  addEntrySheet as addRepo,
  updateEntrySheet as updateRepo,
  deleteEntrySheet as deleteRepo,
  addESQuestion as addQuestionRepo,
  updateESQuestion as updateQuestionRepo,
  deleteESQuestion as deleteQuestionRepo,
} from '@entrify/shared';
import type { EntrySheet, ESQuestion } from '@entrify/shared';
import { useAuth } from './useAuth';

export function useEntrySheets() {
  const { user } = useAuth();
  const [entrySheets, setEntrySheets] = useState<EntrySheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEntrySheets();
      setEntrySheets(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load entry sheets');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(async (entrySheet: EntrySheet) => {
    await addRepo(entrySheet);
    await load();
  }, [load]);

  const update = useCallback(async (entrySheet: EntrySheet) => {
    await updateRepo(entrySheet);
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    await deleteRepo(id);
    await load();
  }, [load]);

  const addQuestion = useCallback(async (question: ESQuestion) => {
    await addQuestionRepo(question);
    await load();
  }, [load]);

  const updateQuestion = useCallback(async (question: ESQuestion) => {
    await updateQuestionRepo(question);
    await load();
  }, [load]);

  const removeQuestion = useCallback(async (questionId: string, entrySheetId: string) => {
    await deleteQuestionRepo(questionId, entrySheetId);
    await load();
  }, [load]);

  const getById = useCallback(async (id: string) => {
    return getEntrySheet(id);
  }, []);

  return {
    entrySheets,
    loading,
    error,
    add,
    update,
    remove,
    addQuestion,
    updateQuestion,
    removeQuestion,
    getById,
    reload: load,
  };
}
