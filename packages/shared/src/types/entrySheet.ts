export interface EntrySheet {
  id: string;
  companyId?: string;
  companyName?: string;
  title: string;
  memo?: string;
  questions: ESQuestion[];
  freeformContent?: string;
  externalLinks?: ESExternalLink[];
  createdAt: string;
  updatedAt: string;
}

export interface ESQuestion {
  id: string;
  entrySheetId: string;
  questionOrder: number;
  questionText: string;
  charLimit?: number;
  answer?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ESExternalLink {
  id: string;
  url: string;
  label: string;
  addedAt: string;
}

export function createEntrySheet(title: string, companyId?: string): EntrySheet {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    companyId,
    title,
    questions: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createESQuestion(entrySheetId: string, questionText: string, questionOrder: number): ESQuestion {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    entrySheetId,
    questionOrder,
    questionText,
    createdAt: now,
    updatedAt: now,
  };
}
