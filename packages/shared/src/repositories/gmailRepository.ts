import { getSupabase, getCurrentUser } from '../lib/supabase';
import type { CachedEmail, GmailSettings, EmailTier, EmailSubType } from '../types/gmail';

interface DbGmailSettings {
  id: string;
  user_id: string;
  is_connected: boolean;
  connected_at: string | null;
  last_sync_at: string | null;
  last_history_id: string | null;
  google_token_expires_at: string | null;
}

interface DbCachedEmail {
  id: string;
  user_id: string;
  gmail_message_id: string;
  gmail_thread_id: string;
  company_id: string | null;
  sender_email: string;
  sender_name: string | null;
  sender_domain: string;
  subject: string;
  received_at: string;
  snippet: string | null;
  is_read: boolean;
  classification: string | null;
  classification_sub_type: string | null;
  created_at: string;
}

function dbToGmailSettings(row: DbGmailSettings): GmailSettings {
  return {
    id: row.id,
    userId: row.user_id,
    isConnected: row.is_connected,
    connectedAt: row.connected_at ?? undefined,
    lastSyncAt: row.last_sync_at ?? undefined,
    lastHistoryId: row.last_history_id ?? undefined,
    googleTokenExpiresAt: row.google_token_expires_at ?? undefined,
  };
}

function dbToCachedEmail(row: DbCachedEmail): CachedEmail {
  return {
    id: row.id,
    userId: row.user_id,
    gmailMessageId: row.gmail_message_id,
    gmailThreadId: row.gmail_thread_id,
    companyId: row.company_id ?? undefined,
    senderEmail: row.sender_email,
    senderName: row.sender_name ?? undefined,
    senderDomain: row.sender_domain,
    subject: row.subject,
    receivedAt: row.received_at,
    snippet: row.snippet ?? undefined,
    isRead: row.is_read,
    classification: (row.classification as EmailTier) ?? undefined,
    classificationSubType: (row.classification_sub_type as EmailSubType) ?? undefined,
    createdAt: row.created_at,
  };
}

export async function getGmailSettings(): Promise<GmailSettings | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data } = await getSupabase()
    .from('user_gmail_settings')
    .select('id, user_id, is_connected, connected_at, last_sync_at, last_history_id, google_token_expires_at')
    .eq('user_id', user.id)
    .single();

  return data ? dbToGmailSettings(data as DbGmailSettings) : null;
}

export async function getCachedEmails(opts?: {
  companyId?: string;
  limit?: number;
}): Promise<CachedEmail[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  let query = getSupabase()
    .from('email_cache')
    .select('*')
    .eq('user_id', user.id)
    .order('received_at', { ascending: false });

  if (opts?.companyId) {
    query = query.eq('company_id', opts.companyId);
  }
  if (opts?.limit) {
    query = query.limit(opts.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to get cached emails: ${error.message}`);
  return (data ?? []).map((row) => dbToCachedEmail(row as DbCachedEmail));
}

export async function upsertCachedEmails(emails: Array<{
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
}>): Promise<void> {
  if (emails.length === 0) return;

  const rows = emails.map((e) => ({
    user_id: e.userId,
    gmail_message_id: e.gmailMessageId,
    gmail_thread_id: e.gmailThreadId,
    company_id: e.companyId ?? null,
    sender_email: e.senderEmail,
    sender_name: e.senderName ?? null,
    sender_domain: e.senderDomain,
    subject: e.subject,
    received_at: e.receivedAt,
    snippet: e.snippet ?? null,
    is_read: e.isRead,
    classification: e.classification ?? null,
    classification_sub_type: e.classificationSubType ?? null,
  }));

  const { error } = await getSupabase()
    .from('email_cache')
    .upsert(rows, { onConflict: 'user_id,gmail_message_id' });

  if (error) throw new Error(`Failed to upsert cached emails: ${error.message}`);
}

export async function getEmailCountByCompany(): Promise<Map<string, number>> {
  const user = await getCurrentUser();
  if (!user) return new Map();

  const { data, error } = await getSupabase()
    .from('email_cache')
    .select('company_id')
    .eq('user_id', user.id)
    .not('company_id', 'is', null);

  if (error) throw new Error(`Failed to get email counts: ${error.message}`);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = row.company_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

export async function getAliasesByMasterIds(
  masterIds: string[],
): Promise<Map<string, string[]>> {
  if (masterIds.length === 0) return new Map();

  const { data, error } = await getSupabase()
    .from('company_name_aliases')
    .select('company_master_id, alias')
    .in('company_master_id', masterIds);

  if (error) throw new Error(`Failed to get aliases: ${error.message}`);

  const map = new Map<string, string[]>();
  for (const row of data ?? []) {
    const id = row.company_master_id as string;
    const list = map.get(id) ?? [];
    list.push(row.alias as string);
    map.set(id, list);
  }
  return map;
}

export async function updateLastSync(lastHistoryId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  await getSupabase()
    .from('user_gmail_settings')
    .update({
      last_sync_at: new Date().toISOString(),
      last_history_id: lastHistoryId,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);
}
