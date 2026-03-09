export type EmailTier = 'tier1' | 'tier2' | 'tier3' | 'tier4';

export type EmailSubType =
  | 'selection_result'
  | 'scheduling'
  | 'submission'
  | 'offer'
  | 'reminder'
  | 'scout'
  | 'deadline_summary'
  | 'noise';

export const TIER_LABELS: Record<EmailTier, string> = {
  tier1: '要対応',
  tier2: '企業関連',
  tier3: 'アクション期限',
  tier4: 'その他',
};

export const SUB_TYPE_LABELS: Partial<Record<EmailSubType, string>> = {
  selection_result: '選考結果',
  scheduling: '日程調整',
  submission: '提出物',
  offer: '内定',
  scout: 'スカウト',
  deadline_summary: '締切まとめ',
};

export interface EmailsByTier {
  tier: EmailTier;
  label: string;
  emails: CachedEmail[];
}

export interface GmailSettings {
  id: string;
  userId: string;
  isConnected: boolean;
  connectedAt?: string;
  lastSyncAt?: string;
  lastHistoryId?: string;
  googleTokenExpiresAt?: string;
}

export interface CachedEmail {
  id: string;
  userId: string;
  gmailMessageId: string;
  gmailThreadId: string;
  companyId?: string;
  senderEmail: string;
  senderName?: string;
  senderDomain: string;
  subject: string;
  receivedAt: string;
  snippet?: string;
  isRead: boolean;
  classification?: EmailTier;
  classificationSubType?: EmailSubType;
  createdAt: string;
}

export interface GmailMessageMetadata {
  id: string;
  threadId: string;
  from: string;
  fromName?: string;
  subject: string;
  date: string;
  snippet: string;
  isRead: boolean;
}

export interface EmailsByCompany {
  companyId: string;
  companyName: string;
  logoUrl?: string;
  emails: CachedEmail[];
  totalCount: number;
}
