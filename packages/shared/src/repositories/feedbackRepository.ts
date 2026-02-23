import { getSupabase, getCurrentUser } from '../lib/supabase';

interface SubmitFeedbackParams {
  rating: number;
  satisfaction?: string;
  complaints?: string;
  featureRequests?: string;
}

export interface FeedbackRow {
  id: string;
  user_id: string;
  rating: number;
  satisfaction: string | null;
  complaints: string | null;
  feature_requests: string | null;
  created_at: string;
}

export async function submitFeedback(params: SubmitFeedbackParams): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const { error } = await getSupabase()
    .from('user_feedback')
    .insert({
      user_id: user.id,
      rating: params.rating,
      satisfaction: params.satisfaction || null,
      complaints: params.complaints || null,
      feature_requests: params.featureRequests || null,
    });

  if (error) {
    console.error('[Feedback] Failed to submit feedback:', error.message);
    throw error;
  }
}

/**
 * Admin: fetch all feedback, newest first.
 * Requires admin RLS policy.
 */
export async function getAllFeedback(limit = 100): Promise<FeedbackRow[]> {
  const { data, error } = await getSupabase()
    .from('user_feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Feedback] Failed to fetch feedback:', error.message);
    return [];
  }
  return (data ?? []) as FeedbackRow[];
}
