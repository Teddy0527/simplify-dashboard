import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL and Anon Key must be set in environment variables');
    }
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: {
          getItem: async (key: string) => {
            const result = await chrome.storage.local.get(key);
            return result[key] ?? null;
          },
          setItem: async (key: string, value: string) => {
            await chrome.storage.local.set({ [key]: value });
          },
          removeItem: async (key: string) => {
            await chrome.storage.local.remove(key);
          },
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseInstance;
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data } = await getSupabase().auth.getSession();
    return !!data.session;
  } catch {
    return false;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data } = await getSupabase().auth.getUser();
    return data.user;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  try {
    const { data } = await getSupabase().auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}
