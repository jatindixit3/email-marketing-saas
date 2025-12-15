-- Additional Database Functions for Warmup System

-- Function to increment warmup send count
CREATE OR REPLACE FUNCTION increment_warmup_sends(
  p_user_id UUID,
  p_count INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE email_warmup
  SET
    emails_sent_today = emails_sent_today + p_count,
    total_emails_sent = total_emails_sent + p_count,
    warmup_emails_sent = CASE
      WHEN is_warmup_active THEN warmup_emails_sent + p_count
      ELSE warmup_emails_sent
    END,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get warmup statistics
CREATE OR REPLACE FUNCTION get_warmup_stats(p_user_id UUID)
RETURNS TABLE (
  current_stage INTEGER,
  daily_limit INTEGER,
  emails_sent_today INTEGER,
  remaining_today INTEGER,
  account_age_days INTEGER,
  total_sent INTEGER,
  avg_daily_sends DECIMAL,
  best_day_count INTEGER,
  reputation_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ew.warmup_stage,
    ew.daily_send_limit,
    ew.emails_sent_today,
    GREATEST(0, ew.daily_send_limit - ew.emails_sent_today) as remaining,
    EXTRACT(DAY FROM NOW() - ew.warmup_start_date)::INTEGER as age_days,
    ew.total_emails_sent,
    COALESCE(
      (SELECT AVG(emails_sent)::DECIMAL FROM warmup_daily_history WHERE user_id = p_user_id),
      0
    ) as avg_sends,
    COALESCE(
      (SELECT MAX(emails_sent) FROM warmup_daily_history WHERE user_id = p_user_id),
      0
    ) as best_day,
    COALESCE(
      (SELECT AVG(reputation_score) FROM warmup_daily_history WHERE user_id = p_user_id AND date >= CURRENT_DATE - INTERVAL '7 days'),
      100.0
    ) as reputation
  FROM email_warmup ew
  WHERE ew.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
