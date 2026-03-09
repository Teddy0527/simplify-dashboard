import type { Company, GmailMessageMetadata, EmailTier, EmailSubType } from '@jobsimplify/shared';
import { classifyEmail, buildClassificationContext } from './emailClassificationService';

const GMAIL_API_BASE = 'https://www.googleapis.com/gmail/v1/users/me';
const BATCH_SIZE = 20;
const MAX_RETRIES = 3;

export function normalizeDomain(domain: string): string {
  const parts = domain.toLowerCase().split('.');
  // Japanese domains (.co.jp, .or.jp, .ne.jp, .ac.jp, .go.jp)
  if (
    parts.length >= 3 &&
    parts[parts.length - 1] === 'jp' &&
    ['co', 'or', 'ne', 'ac', 'go'].includes(parts[parts.length - 2])
  ) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

export function extractDomain(email: string): string {
  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1) return '';
  return email.substring(atIndex + 1).toLowerCase();
}

export function matchEmailToCompany(
  senderDomain: string,
  companies: Company[],
): Company | undefined {
  const normalized = normalizeDomain(senderDomain);
  return companies.find((c) => {
    if (!c.websiteDomain) return false;
    return normalizeDomain(c.websiteDomain) === normalized;
  });
}

function parseEmailAddress(from: string): { email: string; name?: string } {
  // Format: "Name <email@domain.com>" or "email@domain.com"
  const match = from.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+@[^>]+)>?$/);
  if (match) {
    return { email: match[2].trim(), name: match[1]?.trim() || undefined };
  }
  return { email: from.trim() };
}

function getHeader(
  headers: Array<{ name: string; value: string }>,
  name: string,
): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);
    if (res.status === 429) {
      // Rate limited — exponential backoff
      const delay = Math.pow(2, i) * 1000;
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
    return res;
  }
  throw new Error(`Gmail API request failed after ${retries} retries`);
}

async function fetchMessageIds(
  accessToken: string,
  query: string,
  pageToken?: string,
  maxResults = 50,
): Promise<{ messageIds: Array<{ id: string; threadId: string }>; nextPageToken?: string }> {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
  });
  if (pageToken) params.set('pageToken', pageToken);

  const res = await fetchWithRetry(`${GMAIL_API_BASE}/messages?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 401) {
      throw new Error('Gmail認証エラー: 設定ページでGmailを再接続してください');
    }
    if (res.status === 403) {
      throw new Error('Gmail APIアクセス拒否: Google Cloud Consoleでgmail.metadataスコープを有効にしてください');
    }
    throw new Error(`Gmail API エラー (${res.status}): ${body}`);
  }

  const data = await res.json();
  return {
    messageIds: data.messages ?? [],
    nextPageToken: data.nextPageToken,
  };
}

async function fetchMessageMetadata(
  accessToken: string,
  messageId: string,
): Promise<GmailMessageMetadata> {
  const res = await fetchWithRetry(
    `${GMAIL_API_BASE}/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    throw new Error(`Gmail get message failed: ${messageId}`);
  }

  const data = await res.json();
  const headers: Array<{ name: string; value: string }> = data.payload?.headers ?? [];
  const fromRaw = getHeader(headers, 'From');
  const { email, name } = parseEmailAddress(fromRaw);
  const labelIds: string[] = data.labelIds ?? [];

  return {
    id: data.id,
    threadId: data.threadId,
    from: email,
    fromName: name,
    subject: getHeader(headers, 'Subject'),
    date: getHeader(headers, 'Date'),
    snippet: data.snippet ?? '',
    isRead: !labelIds.includes('UNREAD'),
  };
}

export interface SyncDiagnostics {
  query: string;
  totalMessageIds: number;
  metadataFetched: number;
  metadataFailed: number;
}

export interface SyncResult {
  newEmails: number;
  historyId?: string;
}

export async function fetchGmailProfile(accessToken: string): Promise<{
  emailAddress: string;
  messagesTotal: number;
} | null> {
  try {
    const res = await fetchWithRetry(`${GMAIL_API_BASE}/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { emailAddress: data.emailAddress, messagesTotal: data.messagesTotal };
  } catch {
    return null;
  }
}

export async function syncEmails(
  accessToken: string,
  userId: string,
  companies: Company[],
  onProgress?: (fetched: number, total: number) => void,
  aliasMap?: Map<string, string[]>,
): Promise<{
  emails: Array<{
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
  }>;
  historyId?: string;
  diagnostics: SyncDiagnostics;
}> {
  // Fetch all inbox emails from the last 30 days, classify by company post-processing
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateStr = `${thirtyDaysAgo.getFullYear()}/${String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')}/${String(thirtyDaysAgo.getDate()).padStart(2, '0')}`;
  const fullQuery = `in:inbox after:${dateStr}`;

  // Fetch all message IDs
  const allMessageIds: Array<{ id: string; threadId: string }> = [];
  let pageToken: string | undefined;
  do {
    const result = await fetchMessageIds(accessToken, fullQuery, pageToken);
    allMessageIds.push(...result.messageIds);
    pageToken = result.nextPageToken;
  } while (pageToken && allMessageIds.length < 200); // Cap at 200

  const total = allMessageIds.length;
  if (total === 0) return { emails: [], diagnostics: { query: fullQuery, totalMessageIds: 0, metadataFetched: 0, metadataFailed: 0 } };

  // Build classification context
  const classificationCtx = buildClassificationContext(companies, aliasMap ?? new Map());

  // Fetch metadata in batches
  let metadataFetched = 0;
  let metadataFailed = 0;
  const emails: Array<{
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
  }> = [];

  for (let i = 0; i < allMessageIds.length; i += BATCH_SIZE) {
    const batch = allMessageIds.slice(i, i + BATCH_SIZE);
    const metadataPromises = batch.map((msg) =>
      fetchMessageMetadata(accessToken, msg.id).catch(() => null),
    );
    const results = await Promise.all(metadataPromises);

    for (const meta of results) {
      if (!meta) {
        metadataFailed++;
        continue;
      }
      metadataFetched++;
      const domain = extractDomain(meta.from);
      if (!domain) continue;

      const matchedCompany = matchEmailToCompany(domain, companies);

      // Classify email
      const classification = classifyEmail(
        { senderDomain: domain, subject: meta.subject },
        classificationCtx,
      );

      // Use domain-matched company or classification-matched company
      const companyId = matchedCompany?.id ?? classification.matchedCompanyId;

      emails.push({
        userId,
        gmailMessageId: meta.id,
        gmailThreadId: meta.threadId,
        companyId,
        senderEmail: meta.from,
        senderName: meta.fromName,
        senderDomain: domain,
        subject: meta.subject,
        receivedAt: new Date(meta.date).toISOString(),
        snippet: meta.snippet,
        isRead: meta.isRead,
        classification: classification.tier,
        classificationSubType: classification.subType,
      });
    }

    onProgress?.(Math.min(i + BATCH_SIZE, total), total);
  }

  // Get profile for historyId
  let historyId: string | undefined;
  try {
    const profileRes = await fetchWithRetry(`${GMAIL_API_BASE}/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (profileRes.ok) {
      const profile = await profileRes.json();
      historyId = profile.historyId;
    }
  } catch {
    // Non-critical
  }

  const diagnostics: SyncDiagnostics = {
    query: fullQuery,
    totalMessageIds: allMessageIds.length,
    metadataFetched,
    metadataFailed,
  };

  return { emails, historyId, diagnostics };
}

export function getGmailUrl(messageId: string): string {
  return `https://mail.google.com/mail/u/0/#inbox/${messageId}`;
}
