-- Email Warmup System Database Schema
-- Tracks account age, daily send limits, and warmup progress

-- Email warmup configuration per user
CREATE TABLE IF NOT EXISTS email_warmup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Account age tracking
  account_created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  warmup_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  warmup_completed_at TIMESTAMP WITH TIME ZONE,

  -- Current warmup status
  warmup_stage INTEGER NOT NULL DEFAULT 1, -- 1-4 (days 1-3, 4-7, 8-14, 15+)
  is_warmup_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Send tracking for warmup
  daily_send_limit INTEGER NOT NULL DEFAULT 50,
  emails_sent_today INTEGER NOT NULL DEFAULT 0,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Historical tracking
  total_emails_sent INTEGER NOT NULL DEFAULT 0,
  warmup_emails_sent INTEGER NOT NULL DEFAULT 0,

  -- Domain authentication status
  domain VARCHAR(255),
  spf_verified BOOLEAN DEFAULT FALSE,
  dkim_verified BOOLEAN DEFAULT FALSE,
  dmarc_verified BOOLEAN DEFAULT FALSE,
  last_dns_check_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Daily send history for tracking patterns
CREATE TABLE IF NOT EXISTS warmup_daily_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Send metrics
  emails_sent INTEGER NOT NULL DEFAULT 0,
  emails_delivered INTEGER NOT NULL DEFAULT 0,
  emails_bounced INTEGER NOT NULL DEFAULT 0,
  emails_complained INTEGER NOT NULL DEFAULT 0,

  -- Engagement metrics
  opens INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,

  -- Warmup status on this day
  warmup_stage INTEGER NOT NULL,
  daily_limit INTEGER NOT NULL,

  -- Reputation score (0-100)
  reputation_score DECIMAL(5,2) DEFAULT 100.0,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, date)
);

-- Domain authentication records
CREATE TABLE IF NOT EXISTS domain_authentication (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,

  -- DNS records
  spf_record TEXT,
  spf_verified BOOLEAN DEFAULT FALSE,
  spf_last_checked TIMESTAMP WITH TIME ZONE,

  dkim_record TEXT,
  dkim_verified BOOLEAN DEFAULT FALSE,
  dkim_last_checked TIMESTAMP WITH TIME ZONE,

  dmarc_record TEXT,
  dmarc_verified BOOLEAN DEFAULT FALSE,
  dmarc_last_checked TIMESTAMP WITH TIME ZONE,

  -- MX records
  mx_records JSONB,
  mx_verified BOOLEAN DEFAULT FALSE,
  mx_last_checked TIMESTAMP WITH TIME ZONE,

  -- Status
  is_primary BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, failed

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, domain)
);

-- Warmup milestones and achievements
CREATE TABLE IF NOT EXISTS warmup_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  milestone_type VARCHAR(50) NOT NULL, -- stage_completed, threshold_reached, authentication_verified
  milestone_name VARCHAR(255) NOT NULL,
  milestone_description TEXT,

  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Milestone data
  data JSONB,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Sender reputation alerts
CREATE TABLE IF NOT EXISTS warmup_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  alert_type VARCHAR(50) NOT NULL, -- high_bounce_rate, spam_complaints, limit_reached, dns_failure
  severity VARCHAR(20) NOT NULL, -- info, warning, critical
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  -- Alert data
  data JSONB,

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_warmup_user_id ON email_warmup(user_id);
CREATE INDEX IF NOT EXISTS idx_email_warmup_stage ON email_warmup(warmup_stage);
CREATE INDEX IF NOT EXISTS idx_warmup_daily_history_user_date ON warmup_daily_history(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_domain_auth_user_id ON domain_authentication(user_id);
CREATE INDEX IF NOT EXISTS idx_domain_auth_domain ON domain_authentication(domain);
CREATE INDEX IF NOT EXISTS idx_warmup_milestones_user_id ON warmup_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_warmup_alerts_user_id ON warmup_alerts(user_id, is_read, created_at DESC);

-- Function to initialize warmup for new user
CREATE OR REPLACE FUNCTION initialize_warmup_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO email_warmup (
    user_id,
    account_created_at,
    warmup_start_date,
    warmup_stage,
    daily_send_limit
  ) VALUES (
    NEW.id,
    NOW(),
    NOW(),
    1,
    50
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create warmup record for new users
CREATE TRIGGER create_warmup_on_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_warmup_for_user();

-- Function to reset daily send count
CREATE OR REPLACE FUNCTION reset_daily_warmup_count()
RETURNS void AS $$
BEGIN
  UPDATE email_warmup
  SET
    emails_sent_today = 0,
    last_reset_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to update warmup stage based on account age
CREATE OR REPLACE FUNCTION update_warmup_stage()
RETURNS void AS $$
DECLARE
  rec RECORD;
  account_age_days INTEGER;
  new_stage INTEGER;
  new_limit INTEGER;
BEGIN
  FOR rec IN
    SELECT id, user_id, warmup_start_date, warmup_stage, is_warmup_active
    FROM email_warmup
    WHERE is_warmup_active = TRUE
  LOOP
    account_age_days := EXTRACT(DAY FROM NOW() - rec.warmup_start_date);

    -- Determine stage and limit based on age
    IF account_age_days <= 3 THEN
      new_stage := 1;
      new_limit := 50;
    ELSIF account_age_days <= 7 THEN
      new_stage := 2;
      new_limit := 200;
    ELSIF account_age_days <= 14 THEN
      new_stage := 3;
      new_limit := 1000;
    ELSE
      new_stage := 4;
      new_limit := NULL; -- Use plan limit

      -- Mark warmup as completed
      UPDATE email_warmup
      SET
        is_warmup_active = FALSE,
        warmup_completed_at = NOW(),
        warmup_stage = new_stage,
        updated_at = NOW()
      WHERE id = rec.id;

      -- Create milestone
      INSERT INTO warmup_milestones (
        user_id,
        milestone_type,
        milestone_name,
        milestone_description,
        data
      ) VALUES (
        rec.user_id,
        'warmup_completed',
        'Email Warmup Completed',
        'Successfully completed the email warmup period',
        jsonb_build_object(
          'days_to_complete', account_age_days,
          'final_stage', new_stage
        )
      );

      CONTINUE;
    END IF;

    -- Update stage and limit if changed
    IF rec.warmup_stage != new_stage THEN
      UPDATE email_warmup
      SET
        warmup_stage = new_stage,
        daily_send_limit = new_limit,
        updated_at = NOW()
      WHERE id = rec.id;

      -- Create stage completion milestone
      INSERT INTO warmup_milestones (
        user_id,
        milestone_type,
        milestone_name,
        milestone_description,
        data
      ) VALUES (
        rec.user_id,
        'stage_completed',
        'Warmup Stage ' || new_stage || ' Reached',
        'Daily send limit increased to ' || new_limit,
        jsonb_build_object(
          'stage', new_stage,
          'limit', new_limit,
          'account_age_days', account_age_days
        )
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate reputation score
CREATE OR REPLACE FUNCTION calculate_reputation_score(
  p_user_id UUID,
  p_date DATE
)
RETURNS DECIMAL AS $$
DECLARE
  v_score DECIMAL := 100.0;
  v_emails_sent INTEGER;
  v_bounces INTEGER;
  v_complaints INTEGER;
  v_opens INTEGER;
  v_clicks INTEGER;
  v_bounce_rate DECIMAL;
  v_complaint_rate DECIMAL;
  v_open_rate DECIMAL;
BEGIN
  -- Get metrics for the day
  SELECT
    emails_sent,
    emails_bounced,
    emails_complained,
    opens,
    clicks
  INTO
    v_emails_sent,
    v_bounces,
    v_complaints,
    v_opens,
    v_clicks
  FROM warmup_daily_history
  WHERE user_id = p_user_id AND date = p_date;

  IF v_emails_sent = 0 THEN
    RETURN 100.0;
  END IF;

  -- Calculate rates
  v_bounce_rate := (v_bounces::DECIMAL / v_emails_sent) * 100;
  v_complaint_rate := (v_complaints::DECIMAL / v_emails_sent) * 100;
  v_open_rate := (v_opens::DECIMAL / v_emails_sent) * 100;

  -- Deduct points for bad metrics
  -- High bounce rate (>5% is bad)
  IF v_bounce_rate > 5 THEN
    v_score := v_score - (v_bounce_rate * 5);
  END IF;

  -- Spam complaints (>0.1% is bad)
  IF v_complaint_rate > 0.1 THEN
    v_score := v_score - (v_complaint_rate * 50);
  END IF;

  -- Add points for good engagement
  IF v_open_rate > 20 THEN
    v_score := v_score + 5;
  END IF;

  -- Ensure score is between 0 and 100
  v_score := GREATEST(0, LEAST(100, v_score));

  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE email_warmup ENABLE ROW LEVEL SECURITY;
ALTER TABLE warmup_daily_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_authentication ENABLE ROW LEVEL SECURITY;
ALTER TABLE warmup_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE warmup_alerts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own warmup data
CREATE POLICY "Users can view own warmup" ON email_warmup
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own warmup" ON email_warmup
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own warmup history" ON warmup_daily_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own domain auth" ON domain_authentication
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own domain auth" ON domain_authentication
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own milestones" ON warmup_milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own alerts" ON warmup_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON warmup_alerts
  FOR UPDATE USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE email_warmup IS 'Tracks email warmup progress and limits for each user';
COMMENT ON TABLE warmup_daily_history IS 'Daily send metrics and reputation tracking';
COMMENT ON TABLE domain_authentication IS 'DNS authentication records (SPF, DKIM, DMARC, MX)';
COMMENT ON TABLE warmup_milestones IS 'Warmup achievements and milestones';
COMMENT ON TABLE warmup_alerts IS 'Reputation and warmup alerts for users';
