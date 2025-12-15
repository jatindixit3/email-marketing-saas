-- Email Marketing SaaS Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    company_name VARCHAR(255),

    -- Subscription Information
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free', -- free, starter, growth, pro, scale
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, cancelled, past_due, trialing
    subscription_started_at TIMESTAMP WITH TIME ZONE,
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,

    -- Usage Limits & Tracking
    monthly_email_limit INTEGER NOT NULL DEFAULT 1000,
    monthly_emails_sent INTEGER NOT NULL DEFAULT 0,
    contact_limit INTEGER NOT NULL DEFAULT 500,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- LISTS TABLE
-- ============================================
CREATE TABLE lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Stats
    contact_count INTEGER NOT NULL DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for lists
CREATE INDEX idx_lists_user_id ON lists(user_id);
CREATE INDEX idx_lists_deleted_at ON lists(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- CONTACTS TABLE
-- ============================================
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'subscribed', -- subscribed, unsubscribed, bounced, complained
    subscription_source VARCHAR(100), -- website, import, api, manual

    -- Engagement
    email_verified BOOLEAN NOT NULL DEFAULT false,
    last_engaged_at TIMESTAMP WITH TIME ZONE,

    -- Custom Fields
    custom_fields JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Unique constraint per user
    CONSTRAINT unique_contact_email_per_user UNIQUE (user_id, email)
);

-- Indexes for contacts
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_deleted_at ON contacts(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX idx_contacts_custom_fields ON contacts USING GIN(custom_fields);

-- ============================================
-- LIST_CONTACTS (Many-to-Many Relationship)
-- ============================================
CREATE TABLE list_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Ensure unique contact per list
    CONSTRAINT unique_contact_per_list UNIQUE (list_id, contact_id)
);

-- Indexes for list_contacts
CREATE INDEX idx_list_contacts_list_id ON list_contacts(list_id);
CREATE INDEX idx_list_contacts_contact_id ON list_contacts(contact_id);

-- ============================================
-- TEMPLATES TABLE
-- ============================================
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Template Content
    subject VARCHAR(500),
    html_content TEXT NOT NULL,
    text_content TEXT,

    -- Categorization
    category VARCHAR(100), -- newsletter, promotion, welcome, announcement, transactional
    is_public BOOLEAN NOT NULL DEFAULT false,

    -- Usage Stats
    usage_count INTEGER NOT NULL DEFAULT 0,

    -- Thumbnail
    thumbnail_url TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for templates
CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_is_public ON templates(is_public);
CREATE INDEX idx_templates_deleted_at ON templates(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- CAMPAIGNS TABLE
-- ============================================
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES templates(id) ON DELETE SET NULL,

    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    preview_text VARCHAR(255),

    -- Content
    html_content TEXT NOT NULL,
    text_content TEXT,

    -- Status & Scheduling
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, scheduled, sending, sent, paused, cancelled
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,

    -- Recipients
    recipient_count INTEGER NOT NULL DEFAULT 0,

    -- Campaign Stats
    emails_sent INTEGER NOT NULL DEFAULT 0,
    emails_delivered INTEGER NOT NULL DEFAULT 0,
    emails_bounced INTEGER NOT NULL DEFAULT 0,
    emails_opened INTEGER NOT NULL DEFAULT 0,
    emails_clicked INTEGER NOT NULL DEFAULT 0,
    emails_unsubscribed INTEGER NOT NULL DEFAULT 0,
    emails_complained INTEGER NOT NULL DEFAULT 0,

    -- Calculated Rates (stored for performance)
    open_rate DECIMAL(5,2) DEFAULT 0.00,
    click_rate DECIMAL(5,2) DEFAULT 0.00,
    bounce_rate DECIMAL(5,2) DEFAULT 0.00,
    unsubscribe_rate DECIMAL(5,2) DEFAULT 0.00,

    -- Settings
    from_name VARCHAR(255),
    from_email VARCHAR(255),
    reply_to_email VARCHAR(255),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for campaigns
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_template_id ON campaigns(template_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_scheduled_at ON campaigns(scheduled_at);
CREATE INDEX idx_campaigns_sent_at ON campaigns(sent_at);
CREATE INDEX idx_campaigns_deleted_at ON campaigns(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- CAMPAIGN_LISTS (Many-to-Many)
-- ============================================
CREATE TABLE campaign_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_campaign_list UNIQUE (campaign_id, list_id)
);

-- Indexes for campaign_lists
CREATE INDEX idx_campaign_lists_campaign_id ON campaign_lists(campaign_id);
CREATE INDEX idx_campaign_lists_list_id ON campaign_lists(list_id);

-- ============================================
-- EMAIL_EVENTS TABLE
-- ============================================
CREATE TABLE email_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

    -- Event Information
    event_type VARCHAR(50) NOT NULL, -- sent, delivered, opened, clicked, bounced, unsubscribed, complained

    -- Event Details
    user_agent TEXT,
    ip_address INET,
    location VARCHAR(255),
    device_type VARCHAR(50), -- desktop, mobile, tablet

    -- For clicks
    link_url TEXT,
    link_text TEXT,

    -- For bounces
    bounce_type VARCHAR(50), -- hard, soft, complaint
    bounce_reason TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for email_events
CREATE INDEX idx_email_events_campaign_id ON email_events(campaign_id);
CREATE INDEX idx_email_events_contact_id ON email_events(contact_id);
CREATE INDEX idx_email_events_event_type ON email_events(event_type);
CREATE INDEX idx_email_events_created_at ON email_events(created_at);
CREATE INDEX idx_email_events_campaign_contact ON email_events(campaign_id, contact_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update list contact count
CREATE OR REPLACE FUNCTION update_list_contact_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE lists SET contact_count = contact_count + 1 WHERE id = NEW.list_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE lists SET contact_count = contact_count - 1 WHERE id = OLD.list_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_list_count_on_contact_change
AFTER INSERT OR DELETE ON list_contacts
FOR EACH ROW EXECUTE FUNCTION update_list_contact_count();

-- Function to update campaign stats
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE campaigns
    SET
        emails_sent = (SELECT COUNT(*) FROM email_events WHERE campaign_id = NEW.campaign_id AND event_type = 'sent'),
        emails_delivered = (SELECT COUNT(*) FROM email_events WHERE campaign_id = NEW.campaign_id AND event_type = 'delivered'),
        emails_bounced = (SELECT COUNT(*) FROM email_events WHERE campaign_id = NEW.campaign_id AND event_type = 'bounced'),
        emails_opened = (SELECT COUNT(DISTINCT contact_id) FROM email_events WHERE campaign_id = NEW.campaign_id AND event_type = 'opened'),
        emails_clicked = (SELECT COUNT(DISTINCT contact_id) FROM email_events WHERE campaign_id = NEW.campaign_id AND event_type = 'clicked'),
        emails_unsubscribed = (SELECT COUNT(*) FROM email_events WHERE campaign_id = NEW.campaign_id AND event_type = 'unsubscribed'),
        emails_complained = (SELECT COUNT(*) FROM email_events WHERE campaign_id = NEW.campaign_id AND event_type = 'complained')
    WHERE id = NEW.campaign_id;

    -- Update calculated rates
    UPDATE campaigns
    SET
        open_rate = CASE WHEN emails_delivered > 0 THEN (emails_opened::DECIMAL / emails_delivered * 100) ELSE 0 END,
        click_rate = CASE WHEN emails_delivered > 0 THEN (emails_clicked::DECIMAL / emails_delivered * 100) ELSE 0 END,
        bounce_rate = CASE WHEN emails_sent > 0 THEN (emails_bounced::DECIMAL / emails_sent * 100) ELSE 0 END,
        unsubscribe_rate = CASE WHEN emails_delivered > 0 THEN (emails_unsubscribed::DECIMAL / emails_delivered * 100) ELSE 0 END
    WHERE id = NEW.campaign_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_stats_trigger
AFTER INSERT ON email_events
FOR EACH ROW EXECUTE FUNCTION update_campaign_stats();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for active subscribers per user
CREATE VIEW user_active_contacts AS
SELECT
    user_id,
    COUNT(*) as active_contact_count
FROM contacts
WHERE status = 'subscribed' AND deleted_at IS NULL
GROUP BY user_id;

-- View for campaign performance summary
CREATE VIEW campaign_performance AS
SELECT
    c.id,
    c.user_id,
    c.name,
    c.subject,
    c.status,
    c.sent_at,
    c.emails_sent,
    c.emails_delivered,
    c.emails_opened,
    c.emails_clicked,
    c.open_rate,
    c.click_rate,
    c.bounce_rate,
    c.unsubscribe_rate
FROM campaigns c
WHERE c.deleted_at IS NULL;
