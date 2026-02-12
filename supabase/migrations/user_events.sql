-- ============================================
-- User Events Tracking System
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Table
CREATE TABLE user_events (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type     TEXT NOT NULL,
  event_category TEXT NOT NULL,
  metadata       JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_user_events_user_created ON user_events (user_id, created_at DESC);
CREATE INDEX idx_user_events_type_created ON user_events (event_type, created_at DESC);
CREATE INDEX idx_user_events_category ON user_events (event_category, created_at DESC);

-- 2. RLS
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
  ON user_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own events"
  ON user_events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all events"
  ON user_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 3. RPC: get_user_analytics_summary
CREATE OR REPLACE FUNCTION get_user_analytics_summary()
RETURNS TABLE (
  user_id UUID, email TEXT, full_name TEXT, avatar_url TEXT,
  created_at TIMESTAMPTZ, last_active_at TIMESTAMPTZ,
  company_count BIGINT, es_count BIGINT, template_count BIGINT,
  total_events BIGINT, profile_completion FLOAT
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    p.id, p.email, p.full_name, p.avatar_url, p.created_at,
    (SELECT MAX(e.created_at) FROM user_events e WHERE e.user_id = p.id),
    (SELECT COUNT(*) FROM companies c WHERE c.user_id = p.id),
    (SELECT COUNT(*) FROM entry_sheets es WHERE es.user_id = p.id),
    (SELECT COUNT(*) FROM templates t WHERE t.user_id = p.id),
    (SELECT COUNT(*) FROM user_events e WHERE e.user_id = p.id),
    COALESCE((SELECT (
      CASE WHEN (up.profile_data->>'lastName') != '' THEN 1 ELSE 0 END +
      CASE WHEN (up.profile_data->>'firstName') != '' THEN 1 ELSE 0 END +
      CASE WHEN (up.profile_data->>'email') != '' THEN 1 ELSE 0 END +
      CASE WHEN (up.profile_data->>'phoneNumber') != '' THEN 1 ELSE 0 END +
      CASE WHEN (up.profile_data->>'university') != '' THEN 1 ELSE 0 END +
      CASE WHEN (up.profile_data->>'postalCode') != '' THEN 1 ELSE 0 END +
      CASE WHEN (up.profile_data->>'prefecture') != '' THEN 1 ELSE 0 END +
      CASE WHEN (up.profile_data->>'city') != '' THEN 1 ELSE 0 END +
      CASE WHEN (up.profile_data->>'address1') != '' THEN 1 ELSE 0 END +
      CASE WHEN (up.profile_data->>'birthDate') != '' THEN 1 ELSE 0 END
    )::FLOAT / 10.0 FROM user_profiles up WHERE up.user_id = p.id), 0.0)
  FROM profiles p ORDER BY p.created_at DESC;
$$;

-- 4. RPC: get_user_event_breakdown
CREATE OR REPLACE FUNCTION get_user_event_breakdown(p_user_id UUID)
RETURNS TABLE (event_type TEXT, event_category TEXT, event_count BIGINT, last_at TIMESTAMPTZ)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT event_type, event_category, COUNT(*), MAX(created_at)
  FROM user_events WHERE user_id = p_user_id
  GROUP BY event_type, event_category ORDER BY COUNT(*) DESC;
$$;

-- 5. RPC: get_aggregate_trends
CREATE OR REPLACE FUNCTION get_aggregate_trends(p_days INT DEFAULT 30)
RETURNS TABLE (day DATE, event_category TEXT, event_count BIGINT, unique_users BIGINT)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT DATE(created_at), event_category, COUNT(*), COUNT(DISTINCT user_id)
  FROM user_events WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY DATE(created_at), event_category ORDER BY DATE(created_at) DESC;
$$;
