import { getSupabase, isAuthenticated, getCurrentUser } from '../lib/supabase';
import {
  getEntrySheets as getLocalEntrySheets,
  saveEntrySheets as saveLocalEntrySheets,
} from '../storage/chromeStorage';
import type { EntrySheet, ESQuestion } from '../types/entrySheet';
import {
  dbEntrySheetToEntrySheet,
  dbESQuestionToESQuestion,
  entrySheetToDbInsert,
  esQuestionToDbInsert,
} from '../types/database';

export async function getEntrySheets(): Promise<EntrySheet[]> {
  if (!(await isAuthenticated())) {
    return getLocalEntrySheets();
  }

  const user = await getCurrentUser();
  if (!user) return getLocalEntrySheets();

  // Fetch entry sheets with company names
  const { data: entrySheets, error } = await getSupabase()
    .from('entry_sheets')
    .select(`
      *,
      companies:company_id (name)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get entry sheets: ${error.message}`);
  }

  // Fetch all questions for these entry sheets
  const entrySheetIds = (entrySheets ?? []).map((es) => es.id);
  let questions: Record<string, ESQuestion[]> = {};

  if (entrySheetIds.length > 0) {
    const { data: questionsData, error: questionsError } = await getSupabase()
      .from('es_questions')
      .select('*')
      .in('entry_sheet_id', entrySheetIds)
      .order('question_order', { ascending: true });

    if (questionsError) {
      throw new Error(`Failed to get es questions: ${questionsError.message}`);
    }

    // Group questions by entry_sheet_id
    questions = (questionsData ?? []).reduce(
      (acc, q) => {
        if (!acc[q.entry_sheet_id]) {
          acc[q.entry_sheet_id] = [];
        }
        acc[q.entry_sheet_id].push(dbESQuestionToESQuestion(q));
        return acc;
      },
      {} as Record<string, ESQuestion[]>,
    );
  }

  return (entrySheets ?? []).map((es) => {
    const companyName = es.companies?.name;
    const { companies, ...esData } = es;
    return dbEntrySheetToEntrySheet(
      esData,
      [], // questions are already converted
      companyName,
    );
  }).map((es) => ({
    ...es,
    questions: questions[es.id] ?? [],
  }));
}

export async function getEntrySheet(id: string): Promise<EntrySheet | null> {
  if (!(await isAuthenticated())) {
    const entrySheets = await getLocalEntrySheets();
    return entrySheets.find((es) => es.id === id) ?? null;
  }

  const { data: entrySheet, error } = await getSupabase()
    .from('entry_sheets')
    .select(`
      *,
      companies:company_id (name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get entry sheet: ${error.message}`);
  }

  const { data: questionsData, error: questionsError } = await getSupabase()
    .from('es_questions')
    .select('*')
    .eq('entry_sheet_id', id)
    .order('question_order', { ascending: true });

  if (questionsError) {
    throw new Error(`Failed to get es questions: ${questionsError.message}`);
  }

  const companyName = entrySheet.companies?.name;
  const { companies, ...esData } = entrySheet;
  const result = dbEntrySheetToEntrySheet(esData, [], companyName);
  result.questions = (questionsData ?? []).map(dbESQuestionToESQuestion);

  return result;
}

export async function addEntrySheet(entrySheet: EntrySheet): Promise<void> {
  if (!(await isAuthenticated())) {
    const entrySheets = await getLocalEntrySheets();
    entrySheets.push(entrySheet);
    return saveLocalEntrySheets(entrySheets);
  }

  const user = await getCurrentUser();
  if (!user) return;

  const { error } = await getSupabase()
    .from('entry_sheets')
    .insert(entrySheetToDbInsert(entrySheet, user.id));

  if (error) {
    throw new Error(`Failed to add entry sheet: ${error.message}`);
  }

  // Insert questions if any
  if (entrySheet.questions.length > 0) {
    const { error: questionsError } = await getSupabase()
      .from('es_questions')
      .insert(entrySheet.questions.map(esQuestionToDbInsert));

    if (questionsError) {
      throw new Error(`Failed to add es questions: ${questionsError.message}`);
    }
  }
}

export async function updateEntrySheet(entrySheet: EntrySheet): Promise<void> {
  if (!(await isAuthenticated())) {
    const entrySheets = await getLocalEntrySheets();
    const index = entrySheets.findIndex((es) => es.id === entrySheet.id);
    if (index !== -1) {
      entrySheets[index] = { ...entrySheet, updatedAt: new Date().toISOString() };
      return saveLocalEntrySheets(entrySheets);
    }
    return;
  }

  const { error } = await getSupabase()
    .from('entry_sheets')
    .update({
      company_id: entrySheet.companyId ?? null,
      title: entrySheet.title,
      memo: entrySheet.memo ?? null,
      freeform_content: entrySheet.freeformContent ?? null,
      external_links: entrySheet.externalLinks && entrySheet.externalLinks.length > 0 ? entrySheet.externalLinks : null,
    })
    .eq('id', entrySheet.id);

  if (error) {
    throw new Error(`Failed to update entry sheet: ${error.message}`);
  }
}

export async function deleteEntrySheet(id: string): Promise<void> {
  if (!(await isAuthenticated())) {
    const entrySheets = await getLocalEntrySheets();
    return saveLocalEntrySheets(entrySheets.filter((es) => es.id !== id));
  }

  // Questions will be cascade deleted
  const { error } = await getSupabase()
    .from('entry_sheets')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete entry sheet: ${error.message}`);
  }
}

// Question operations
export async function addESQuestion(question: ESQuestion): Promise<void> {
  if (!(await isAuthenticated())) {
    const entrySheets = await getLocalEntrySheets();
    const esIndex = entrySheets.findIndex((es) => es.id === question.entrySheetId);
    if (esIndex !== -1) {
      entrySheets[esIndex].questions.push(question);
      entrySheets[esIndex].updatedAt = new Date().toISOString();
      return saveLocalEntrySheets(entrySheets);
    }
    return;
  }

  const { error } = await getSupabase()
    .from('es_questions')
    .insert(esQuestionToDbInsert(question));

  if (error) {
    throw new Error(`Failed to add es question: ${error.message}`);
  }
}

export async function updateESQuestion(question: ESQuestion): Promise<void> {
  if (!(await isAuthenticated())) {
    const entrySheets = await getLocalEntrySheets();
    const esIndex = entrySheets.findIndex((es) => es.id === question.entrySheetId);
    if (esIndex !== -1) {
      const qIndex = entrySheets[esIndex].questions.findIndex((q) => q.id === question.id);
      if (qIndex !== -1) {
        entrySheets[esIndex].questions[qIndex] = {
          ...question,
          updatedAt: new Date().toISOString(),
        };
        entrySheets[esIndex].updatedAt = new Date().toISOString();
        return saveLocalEntrySheets(entrySheets);
      }
    }
    return;
  }

  const { error } = await getSupabase()
    .from('es_questions')
    .update({
      question_order: question.questionOrder,
      question_text: question.questionText,
      char_limit: question.charLimit ?? null,
      answer: question.answer ?? null,
    })
    .eq('id', question.id);

  if (error) {
    throw new Error(`Failed to update es question: ${error.message}`);
  }
}

export async function deleteESQuestion(questionId: string, entrySheetId: string): Promise<void> {
  if (!(await isAuthenticated())) {
    const entrySheets = await getLocalEntrySheets();
    const esIndex = entrySheets.findIndex((es) => es.id === entrySheetId);
    if (esIndex !== -1) {
      entrySheets[esIndex].questions = entrySheets[esIndex].questions.filter(
        (q) => q.id !== questionId,
      );
      entrySheets[esIndex].updatedAt = new Date().toISOString();
      return saveLocalEntrySheets(entrySheets);
    }
    return;
  }

  const { error } = await getSupabase()
    .from('es_questions')
    .delete()
    .eq('id', questionId);

  if (error) {
    throw new Error(`Failed to delete es question: ${error.message}`);
  }
}

export async function reorderESQuestions(
  entrySheetId: string,
  questionIds: string[],
): Promise<void> {
  if (!(await isAuthenticated())) {
    const entrySheets = await getLocalEntrySheets();
    const esIndex = entrySheets.findIndex((es) => es.id === entrySheetId);
    if (esIndex !== -1) {
      const questions = entrySheets[esIndex].questions;
      entrySheets[esIndex].questions = questionIds
        .map((id, index) => {
          const q = questions.find((q) => q.id === id);
          if (q) {
            return { ...q, questionOrder: index };
          }
          return null;
        })
        .filter((q): q is ESQuestion => q !== null);
      entrySheets[esIndex].updatedAt = new Date().toISOString();
      return saveLocalEntrySheets(entrySheets);
    }
    return;
  }

  // Update each question's order
  const updates = questionIds.map((id, index) =>
    getSupabase()
      .from('es_questions')
      .update({ question_order: index })
      .eq('id', id),
  );

  const results = await Promise.all(updates);
  const error = results.find((r) => r.error)?.error;
  if (error) {
    throw new Error(`Failed to reorder es questions: ${error.message}`);
  }
}
