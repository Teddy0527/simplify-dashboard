import { getSupabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export async function signInWithGoogle(): Promise<{ user: User; session: Session }> {
  const redirectUrl = chrome.identity.getRedirectURL();

  // nonceを生成（signInWithIdTokenに必要）
  const nonce = crypto.randomUUID();
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(nonce));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  // Google OAuth URLを構築（id_tokenを要求）
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    response_type: 'id_token',
    redirect_uri: redirectUrl,
    scope: 'openid email profile',
    nonce: hashedNonce,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  // Chrome拡張のOAuthフロー
  const responseUrl = await new Promise<string>((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      (callbackUrl) => {
        if (chrome.runtime.lastError || !callbackUrl) {
          reject(new Error(chrome.runtime.lastError?.message || 'Auth flow failed'));
          return;
        }
        resolve(callbackUrl);
      },
    );
  });

  // レスポンスURLからid_tokenを取得
  const hashParams = new URLSearchParams(new URL(responseUrl).hash.substring(1));
  const idToken = hashParams.get('id_token');

  if (!idToken) {
    throw new Error('No ID token received');
  }

  // SupabaseにIDトークンでサインイン
  const { data, error } = await getSupabase().auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
    nonce: nonce,
  });

  if (error || !data.session || !data.user) {
    throw new Error(error?.message || 'Failed to sign in with Supabase');
  }

  return { user: data.user, session: data.session };
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function getSession(): Promise<Session | null> {
  const { data } = await getSupabase().auth.getSession();
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await getSupabase().auth.getUser();
  return data.user;
}

export function onAuthStateChange(
  callback: (session: Session | null) => void,
): { unsubscribe: () => void } {
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return { unsubscribe: data.subscription.unsubscribe };
}
