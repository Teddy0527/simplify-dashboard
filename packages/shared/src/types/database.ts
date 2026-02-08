import type { Profile } from './profile';
import type { Template, TemplateType } from './template';
import type { Company, SelectionStatus, SelectionStage, CompanyDeadline } from './company';
import type { EntrySheet, ESQuestion, ESExternalLink } from './entrySheet';

// Supabase Database型定義
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          profile_data: Profile;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          profile_data: Profile;
        };
        Update: {
          profile_data?: Profile;
        };
      };
      templates: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          content_200: string | null;
          content_400: string | null;
          content_600: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          content_200?: string | null;
          content_400?: string | null;
          content_600?: string | null;
        };
        Update: {
          type?: string;
          title?: string;
          content_200?: string | null;
          content_400?: string | null;
          content_600?: string | null;
        };
      };
      companies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          industry: string | null;
          login_url: string | null;
          login_password: string | null;
          my_page_id: string | null;
          logo_url: string | null;
          website_domain: string | null;
          recruit_url: string | null;
          company_master_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          industry?: string | null;
          login_url?: string | null;
          login_password?: string | null;
          my_page_id?: string | null;
          logo_url?: string | null;
          website_domain?: string | null;
          recruit_url?: string | null;
          company_master_id?: string | null;
        };
        Update: {
          name?: string;
          industry?: string | null;
          login_url?: string | null;
          login_password?: string | null;
          my_page_id?: string | null;
          logo_url?: string | null;
          website_domain?: string | null;
          recruit_url?: string | null;
          company_master_id?: string | null;
        };
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          status: string;
          stages: SelectionStage[];
          deadlines: CompanyDeadline[] | null;
          memo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          status?: string;
          stages?: SelectionStage[];
          deadlines?: CompanyDeadline[] | null;
          memo?: string | null;
        };
        Update: {
          status?: string;
          stages?: SelectionStage[];
          deadlines?: CompanyDeadline[] | null;
          memo?: string | null;
        };
      };
      entry_sheets: {
        Row: {
          id: string;
          user_id: string;
          company_id: string | null;
          title: string;
          memo: string | null;
          freeform_content: string | null;
          external_links: ESExternalLink[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id?: string | null;
          title: string;
          memo?: string | null;
          freeform_content?: string | null;
          external_links?: ESExternalLink[] | null;
        };
        Update: {
          company_id?: string | null;
          title?: string;
          memo?: string | null;
          freeform_content?: string | null;
          external_links?: ESExternalLink[] | null;
        };
      };
      es_questions: {
        Row: {
          id: string;
          entry_sheet_id: string;
          question_order: number;
          question_text: string;
          char_limit: number | null;
          answer: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          entry_sheet_id: string;
          question_order?: number;
          question_text: string;
          char_limit?: number | null;
          answer?: string | null;
        };
        Update: {
          question_order?: number;
          question_text?: string;
          char_limit?: number | null;
          answer?: string | null;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// DB行 → アプリ型の変換
export function dbTemplateToTemplate(row: Database['public']['Tables']['templates']['Row']): Template {
  return {
    id: row.id,
    type: row.type as TemplateType,
    title: row.title,
    content200: row.content_200 ?? undefined,
    content400: row.content_400 ?? undefined,
    content600: row.content_600 ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// アプリ型 → DB行の変換
export function templateToDbInsert(
  template: Template,
  userId: string,
): Database['public']['Tables']['templates']['Insert'] {
  return {
    id: template.id,
    user_id: userId,
    type: template.type,
    title: template.title,
    content_200: template.content200 ?? null,
    content_400: template.content400 ?? null,
    content_600: template.content600 ?? null,
  };
}

// companies + applications → Company型の変換
export function dbToCompany(
  company: Database['public']['Tables']['companies']['Row'],
  application: Database['public']['Tables']['applications']['Row'],
): Company {
  return {
    id: company.id,
    name: company.name,
    industry: company.industry ?? undefined,
    status: (application.status === 'applied' ? 'es_submitted' : application.status) as SelectionStatus,
    stages: application.stages ?? [],
    deadlines: application.deadlines ?? [],
    memo: application.memo ?? undefined,
    loginUrl: company.login_url ?? undefined,
    myPageId: company.my_page_id ?? undefined,
    loginPassword: company.login_password ?? undefined,
    logoUrl: company.logo_url ?? undefined,
    websiteDomain: company.website_domain ?? undefined,
    recruitUrl: company.recruit_url ?? undefined,
    companyMasterId: company.company_master_id ?? undefined,
    createdAt: company.created_at,
    updatedAt: application.updated_at,
  };
}

// DB行 → EntrySheet型の変換
export function dbEntrySheetToEntrySheet(
  row: Database['public']['Tables']['entry_sheets']['Row'],
  questions: Database['public']['Tables']['es_questions']['Row'][],
  companyName?: string,
): EntrySheet {
  return {
    id: row.id,
    companyId: row.company_id ?? undefined,
    companyName,
    title: row.title,
    memo: row.memo ?? undefined,
    questions: questions.map(dbESQuestionToESQuestion),
    freeformContent: row.freeform_content ?? undefined,
    externalLinks: row.external_links && row.external_links.length > 0 ? row.external_links : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// DB行 → ESQuestion型の変換
export function dbESQuestionToESQuestion(
  row: Database['public']['Tables']['es_questions']['Row'],
): ESQuestion {
  return {
    id: row.id,
    entrySheetId: row.entry_sheet_id,
    questionOrder: row.question_order,
    questionText: row.question_text,
    charLimit: row.char_limit ?? undefined,
    answer: row.answer ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// EntrySheet → DB Insert型の変換
export function entrySheetToDbInsert(
  entrySheet: EntrySheet,
  userId: string,
): Database['public']['Tables']['entry_sheets']['Insert'] {
  return {
    id: entrySheet.id,
    user_id: userId,
    company_id: entrySheet.companyId ?? null,
    title: entrySheet.title,
    memo: entrySheet.memo ?? null,
    freeform_content: entrySheet.freeformContent ?? null,
    external_links: entrySheet.externalLinks && entrySheet.externalLinks.length > 0 ? entrySheet.externalLinks : null,
  };
}

// ESQuestion → DB Insert型の変換
export function esQuestionToDbInsert(
  question: ESQuestion,
): Database['public']['Tables']['es_questions']['Insert'] {
  return {
    id: question.id,
    entry_sheet_id: question.entrySheetId,
    question_order: question.questionOrder,
    question_text: question.questionText,
    char_limit: question.charLimit ?? null,
    answer: question.answer ?? null,
  };
}
