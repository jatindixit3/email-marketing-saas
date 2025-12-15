-- Contact List Management Database Schema
-- Enhanced schema for comprehensive list CRUD with many-to-many relationships

-- =======================
-- Contact Lists Table
-- =======================

CREATE TABLE IF NOT EXISTS contact_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- List Details
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Statistics (cached for performance)
  total_contacts INTEGER DEFAULT 0,
  active_contacts INTEGER DEFAULT 0,
  subscribed_contacts INTEGER DEFAULT 0,

  -- Settings
  is_default BOOLEAN DEFAULT FALSE,
  allow_duplicates BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT contact_lists_user_name_unique UNIQUE(user_id, name, deleted_at)
);

-- Index for user's lists
CREATE INDEX IF NOT EXISTS idx_contact_lists_user ON contact_lists(user_id) WHERE deleted_at IS NULL;

-- =======================
-- Contacts Table (Enhanced)
-- =======================

-- Add list relationship columns if they don't exist
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'subscribed', -- 'subscribed', 'unsubscribed', 'bounced', 'complained'
ADD COLUMN IF NOT EXISTS tags TEXT[], -- Array of tags for segmentation
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'; -- Flexible custom fields

-- Update existing columns
ALTER TABLE contacts
ALTER COLUMN custom_fields TYPE JSONB USING custom_fields::JSONB;

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_contacts_subscription ON contacts(subscription_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING GIN(tags) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_metadata ON contacts USING GIN(metadata) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_email_search ON contacts USING gin(to_tsvector('english', email));

-- =======================
-- Contact List Members (Many-to-Many)
-- =======================

CREATE TABLE IF NOT EXISTS contact_list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES contact_lists(id) ON DELETE CASCADE,

  -- Member-specific data
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by VARCHAR(50) DEFAULT 'manual', -- 'manual', 'import', 'api', 'form'

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Prevent duplicate memberships
  CONSTRAINT contact_list_members_unique UNIQUE(contact_id, list_id)
);

-- Indexes for lookups
CREATE INDEX IF NOT EXISTS idx_members_contact ON contact_list_members(contact_id);
CREATE INDEX IF NOT EXISTS idx_members_list ON contact_list_members(list_id);
CREATE INDEX IF NOT EXISTS idx_members_active ON contact_list_members(is_active) WHERE is_active = TRUE;

-- =======================
-- Contact Segments
-- =======================

CREATE TABLE IF NOT EXISTS contact_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  list_id UUID REFERENCES contact_lists(id) ON DELETE CASCADE,

  -- Segment Details
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Filter Criteria (stored as JSON)
  filters JSONB NOT NULL DEFAULT '{}',
  /*
  Example filters structure:
  {
    "conditions": [
      { "field": "email", "operator": "contains", "value": "@gmail.com" },
      { "field": "tags", "operator": "includes", "value": "vip" },
      { "field": "custom_fields.country", "operator": "equals", "value": "US" }
    ],
    "logic": "AND" // or "OR"
  }
  */

  -- Statistics
  matched_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT segments_user_name_unique UNIQUE(user_id, name, deleted_at)
);

-- Index for user's segments
CREATE INDEX IF NOT EXISTS idx_segments_user ON contact_segments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_segments_list ON contact_segments(list_id) WHERE deleted_at IS NULL;

-- =======================
-- Contact Duplicates
-- =======================

CREATE TABLE IF NOT EXISTS contact_duplicates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Duplicate contacts
  primary_contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  duplicate_contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  -- Similarity score (0.0 - 1.0)
  similarity_score DECIMAL(3,2) DEFAULT 0.00,

  -- Matching fields
  matched_fields TEXT[], -- ['email', 'phone', 'name']

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'merged', 'ignored'
  merged_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT duplicates_unique UNIQUE(primary_contact_id, duplicate_contact_id)
);

-- Index for finding duplicates
CREATE INDEX IF NOT EXISTS idx_duplicates_user ON contact_duplicates(user_id, status);
CREATE INDEX IF NOT EXISTS idx_duplicates_primary ON contact_duplicates(primary_contact_id);

-- =======================
-- List Statistics (Aggregated)
-- =======================

CREATE TABLE IF NOT EXISTS list_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES contact_lists(id) ON DELETE CASCADE,

  -- Date
  date DATE NOT NULL,

  -- Counts
  total_contacts INTEGER DEFAULT 0,
  new_contacts INTEGER DEFAULT 0,
  removed_contacts INTEGER DEFAULT 0,
  subscribed_contacts INTEGER DEFAULT 0,
  unsubscribed_contacts INTEGER DEFAULT 0,

  -- Engagement (from email_events)
  total_opens INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  unique_opens INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,

  -- Growth
  growth_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT list_stats_unique UNIQUE(list_id, date)
);

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_list_stats_date ON list_statistics(list_id, date DESC);

-- =======================
-- Triggers
-- =======================

-- Update list total_contacts when members added/removed
CREATE OR REPLACE FUNCTION update_list_contact_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE contact_lists
    SET total_contacts = total_contacts + 1,
        updated_at = NOW()
    WHERE id = NEW.list_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE contact_lists
    SET total_contacts = GREATEST(0, total_contacts - 1),
        updated_at = NOW()
    WHERE id = OLD.list_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contact_list_members_count ON contact_list_members;
CREATE TRIGGER contact_list_members_count
  AFTER INSERT OR DELETE ON contact_list_members
  FOR EACH ROW
  EXECUTE FUNCTION update_list_contact_count();

-- Update list updated_at timestamp
CREATE OR REPLACE FUNCTION update_list_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contact_lists_updated ON contact_lists;
CREATE TRIGGER contact_lists_updated
  BEFORE UPDATE ON contact_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_list_timestamp();

-- =======================
-- Helper Functions
-- =======================

-- Get list statistics
CREATE OR REPLACE FUNCTION get_list_stats(p_list_id UUID)
RETURNS TABLE (
  total_contacts BIGINT,
  active_contacts BIGINT,
  subscribed_contacts BIGINT,
  unsubscribed_contacts BIGINT,
  bounced_contacts BIGINT,
  growth_7_days INTEGER,
  growth_30_days INTEGER,
  avg_engagement_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT clm.contact_id) AS total_contacts,
    COUNT(DISTINCT clm.contact_id) FILTER (WHERE c.subscription_status = 'subscribed') AS active_contacts,
    COUNT(DISTINCT clm.contact_id) FILTER (WHERE c.subscription_status = 'subscribed') AS subscribed_contacts,
    COUNT(DISTINCT clm.contact_id) FILTER (WHERE c.subscription_status = 'unsubscribed') AS unsubscribed_contacts,
    COUNT(DISTINCT clm.contact_id) FILTER (WHERE c.subscription_status = 'bounced') AS bounced_contacts,
    COUNT(DISTINCT clm.contact_id) FILTER (WHERE clm.added_at >= NOW() - INTERVAL '7 days')::INTEGER AS growth_7_days,
    COUNT(DISTINCT clm.contact_id) FILTER (WHERE clm.added_at >= NOW() - INTERVAL '30 days')::INTEGER AS growth_30_days,
    COALESCE(
      (
        SELECT ROUND(
          (COUNT(DISTINCT ee.contact_id)::DECIMAL /
           NULLIF(COUNT(DISTINCT clm2.contact_id), 0)) * 100,
          2
        )
        FROM contact_list_members clm2
        LEFT JOIN email_events ee ON ee.contact_id = clm2.contact_id
          AND ee.event_type IN ('opened', 'clicked')
          AND ee.created_at >= NOW() - INTERVAL '30 days'
        WHERE clm2.list_id = p_list_id
      ),
      0
    ) AS avg_engagement_rate
  FROM contact_list_members clm
  LEFT JOIN contacts c ON c.id = clm.contact_id
  WHERE clm.list_id = p_list_id
    AND c.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Find duplicate contacts
CREATE OR REPLACE FUNCTION find_duplicate_contacts(p_user_id UUID)
RETURNS TABLE (
  contact_id_1 UUID,
  contact_id_2 UUID,
  similarity_score DECIMAL,
  matched_fields TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH contacts_data AS (
    SELECT
      id,
      LOWER(TRIM(email)) AS email_norm,
      LOWER(TRIM(COALESCE(first_name, ''))) AS first_name_norm,
      LOWER(TRIM(COALESCE(last_name, ''))) AS last_name_norm,
      LOWER(TRIM(REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g'))) AS phone_norm
    FROM contacts
    WHERE user_id = p_user_id
      AND deleted_at IS NULL
  )
  SELECT DISTINCT ON (LEAST(c1.id, c2.id), GREATEST(c1.id, c2.id))
    LEAST(c1.id, c2.id) AS contact_id_1,
    GREATEST(c1.id, c2.id) AS contact_id_2,
    CASE
      WHEN c1.email_norm = c2.email_norm THEN 1.0
      WHEN c1.phone_norm = c2.phone_norm AND c1.phone_norm != '' THEN 0.9
      WHEN c1.first_name_norm = c2.first_name_norm
        AND c1.last_name_norm = c2.last_name_norm
        AND c1.first_name_norm != '' THEN 0.8
      ELSE 0.5
    END::DECIMAL(3,2) AS similarity_score,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN c1.email_norm = c2.email_norm THEN 'email' END,
      CASE WHEN c1.phone_norm = c2.phone_norm AND c1.phone_norm != '' THEN 'phone' END,
      CASE WHEN c1.first_name_norm = c2.first_name_norm AND c1.first_name_norm != '' THEN 'first_name' END,
      CASE WHEN c1.last_name_norm = c2.last_name_norm AND c1.last_name_norm != '' THEN 'last_name' END
    ], NULL) AS matched_fields
  FROM contacts_data c1
  INNER JOIN contacts_data c2 ON c1.id < c2.id
  WHERE (
    c1.email_norm = c2.email_norm
    OR (c1.phone_norm = c2.phone_norm AND c1.phone_norm != '')
    OR (
      c1.first_name_norm = c2.first_name_norm
      AND c1.last_name_norm = c2.last_name_norm
      AND c1.first_name_norm != ''
    )
  )
  ORDER BY LEAST(c1.id, c2.id), GREATEST(c1.id, c2.id), similarity_score DESC;
END;
$$ LANGUAGE plpgsql;

-- =======================
-- Sample Data Functions
-- =======================

-- Create default list for new users
CREATE OR REPLACE FUNCTION create_default_list(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_list_id UUID;
BEGIN
  INSERT INTO contact_lists (user_id, name, description, is_default)
  VALUES (p_user_id, 'All Contacts', 'Default list for all contacts', TRUE)
  RETURNING id INTO v_list_id;

  RETURN v_list_id;
END;
$$ LANGUAGE plpgsql;

-- =======================
-- Views
-- =======================

-- List overview with statistics
CREATE OR REPLACE VIEW list_overview AS
SELECT
  cl.id AS list_id,
  cl.user_id,
  cl.name,
  cl.description,
  cl.is_default,
  cl.total_contacts,
  cl.created_at,
  cl.updated_at,

  -- Subscription breakdown
  COUNT(DISTINCT clm.contact_id) FILTER (WHERE c.subscription_status = 'subscribed') AS subscribed_count,
  COUNT(DISTINCT clm.contact_id) FILTER (WHERE c.subscription_status = 'unsubscribed') AS unsubscribed_count,
  COUNT(DISTINCT clm.contact_id) FILTER (WHERE c.subscription_status = 'bounced') AS bounced_count,

  -- Recent growth
  COUNT(DISTINCT clm.contact_id) FILTER (WHERE clm.added_at >= NOW() - INTERVAL '7 days') AS growth_7_days,
  COUNT(DISTINCT clm.contact_id) FILTER (WHERE clm.added_at >= NOW() - INTERVAL '30 days') AS growth_30_days

FROM contact_lists cl
LEFT JOIN contact_list_members clm ON clm.list_id = cl.id
LEFT JOIN contacts c ON c.id = clm.contact_id AND c.deleted_at IS NULL
WHERE cl.deleted_at IS NULL
GROUP BY cl.id;

-- Contact with all lists
CREATE OR REPLACE VIEW contact_with_lists AS
SELECT
  c.id AS contact_id,
  c.user_id,
  c.email,
  c.first_name,
  c.last_name,
  c.phone,
  c.company,
  c.subscription_status,
  c.tags,
  c.metadata,
  c.created_at,
  c.last_engaged_at,
  ARRAY_AGG(DISTINCT cl.id) FILTER (WHERE cl.id IS NOT NULL) AS list_ids,
  ARRAY_AGG(DISTINCT cl.name) FILTER (WHERE cl.name IS NOT NULL) AS list_names,
  COUNT(DISTINCT cl.id) AS list_count
FROM contacts c
LEFT JOIN contact_list_members clm ON clm.contact_id = c.id
LEFT JOIN contact_lists cl ON cl.id = clm.list_id AND cl.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id;
