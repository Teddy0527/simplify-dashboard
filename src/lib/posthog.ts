import posthog from 'posthog-js';
import { getSupabase } from '@jobsimplify/shared';

export function initPostHog(): void {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST;

  if (!key) return;

  posthog.init(key, {
    api_host: host || '/ingest',
    ui_host: 'https://us.posthog.com',
    autocapture: true,
    capture_pageview: false, // SPA: manually capture in usePageTracking
    session_recording: {
      maskAllInputs: true,
    },
    persistence: 'localStorage+cookie',
  });

  if (import.meta.env.DEV) {
    posthog.debug();
  }
}

export async function enrichPostHogProfile(userId: string): Promise<void> {
  const supabase = getSupabase();

  const [companiesResult, profileResult] = await Promise.all([
    supabase.from('companies').select('selection_status').eq('user_id', userId),
    supabase.from('user_profiles').select('profile_data').eq('user_id', userId).single(),
  ]);

  const companies = companiesResult.data;
  const profileData = profileResult.data?.profile_data as Record<string, unknown> | undefined;

  const statusCounts: Record<string, number> = {};
  companies?.forEach((c) => {
    statusCounts[c.selection_status] = (statusCounts[c.selection_status] || 0) + 1;
  });

  posthog.people.set({
    total_companies: companies?.length ?? 0,
    ...Object.fromEntries(
      Object.entries(statusCounts).map(([k, v]) => [`companies_${k}`, v])
    ),
    university: (profileData?.university as string) || null,
    graduation_year: (profileData?.graduationYear as number) || null,
    has_profile: !!(profileData?.university),
  });
}

export { posthog };
