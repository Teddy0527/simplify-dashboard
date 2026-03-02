-- ================================================================
-- Autofill Analytics RPC Functions
-- ================================================================

-- Daily metrics for autofill events
CREATE OR REPLACE FUNCTION get_autofill_daily_metrics(p_days INT DEFAULT 30)
RETURNS TABLE (
  date       DATE,
  total_runs BIGINT,
  success    BIGINT,
  errors     BIGINT,
  unique_users BIGINT,
  filled_fields BIGINT
) LANGUAGE sql STABLE AS $$
  SELECT
    (created_at AT TIME ZONE 'Asia/Tokyo')::date AS date,
    COUNT(*)                                     AS total_runs,
    COUNT(*) FILTER (WHERE event_type = 'autofill.success') AS success,
    COUNT(*) FILTER (WHERE event_type = 'autofill.error')   AS errors,
    COUNT(DISTINCT user_id)                      AS unique_users,
    COALESCE(SUM((metadata->>'filledCount')::int) FILTER (WHERE event_type = 'autofill.success'), 0) AS filled_fields
  FROM user_events
  WHERE event_category = 'autofill'
    AND created_at >= NOW() - (p_days || ' days')::interval
  GROUP BY 1
  ORDER BY 1;
$$;

-- Site (domain) ranking for autofill usage
CREATE OR REPLACE FUNCTION get_autofill_site_ranking(p_days INT DEFAULT 30, p_limit INT DEFAULT 20)
RETURNS TABLE (
  domain       TEXT,
  total_runs   BIGINT,
  unique_users BIGINT,
  filled_fields BIGINT,
  top_urls     JSONB
) LANGUAGE sql STABLE AS $$
  WITH ranked AS (
    SELECT
      metadata->>'domain' AS domain,
      COUNT(*)            AS total_runs,
      COUNT(DISTINCT user_id) AS unique_users,
      COALESCE(SUM((metadata->>'filledCount')::int) FILTER (WHERE event_type = 'autofill.success'), 0) AS filled_fields
    FROM user_events
    WHERE event_category = 'autofill'
      AND created_at >= NOW() - (p_days || ' days')::interval
      AND metadata->>'domain' IS NOT NULL
    GROUP BY 1
    ORDER BY total_runs DESC
    LIMIT p_limit
  ),
  url_agg AS (
    SELECT
      metadata->>'domain' AS domain,
      jsonb_agg(DISTINCT metadata->>'pageUrl') FILTER (WHERE metadata->>'pageUrl' IS NOT NULL) AS urls
    FROM user_events
    WHERE event_category = 'autofill'
      AND created_at >= NOW() - (p_days || ' days')::interval
    GROUP BY 1
  )
  SELECT
    r.domain,
    r.total_runs,
    r.unique_users,
    r.filled_fields,
    COALESCE(
      (SELECT jsonb_agg(v) FROM (SELECT jsonb_array_elements(u.urls) AS v LIMIT 5) sub),
      '[]'::jsonb
    ) AS top_urls
  FROM ranked r
  LEFT JOIN url_agg u ON u.domain = r.domain
  ORDER BY r.total_runs DESC;
$$;
