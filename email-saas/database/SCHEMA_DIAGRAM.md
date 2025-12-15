# Database Schema Diagram

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USERS TABLE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ PK  id (UUID)                                                           │
│     email (VARCHAR, UNIQUE)                                             │
│     password_hash (VARCHAR)                                             │
│     subscription_tier (VARCHAR) - free/starter/growth/pro/scale         │
│     subscription_status (VARCHAR) - active/cancelled/past_due/trialing  │
│     monthly_email_limit (INT)                                           │
│     monthly_emails_sent (INT)                                           │
│     contact_limit (INT)                                                 │
│     metadata (JSONB)                                                    │
│     settings (JSONB)                                                    │
│     created_at, updated_at, deleted_at (TIMESTAMPTZ)                    │
└─────────────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ├──────────────────┬──────────────────┬───────────────┬─────────────
         │                  │                  │               │
         ▼                  ▼                  ▼               ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│   LISTS TABLE    │ │  CONTACTS TABLE  │ │  TEMPLATES   │ │  CAMPAIGNS   │
├──────────────────┤ ├──────────────────┤ ├──────────────┤ ├──────────────┤
│ PK  id           │ │ PK  id           │ │ PK  id       │ │ PK  id       │
│ FK  user_id ─────┼─┤ FK  user_id ─────┼─┤ FK  user_id  │ │ FK  user_id  │
│     name         │ │     email        │ │     name     │ │     name     │
│     description  │ │     first_name   │ │  html_content│ │     subject  │
│  contact_count   │ │     last_name    │ │  text_content│ │  html_content│
│     metadata     │ │     status       │ │     category │ │     status   │
│  created_at      │ │  custom_fields   │ │   is_public  │ │  scheduled_at│
│  updated_at      │ │     tags[]       │ │ usage_count  │ │  emails_sent │
│  deleted_at      │ │  created_at      │ │  created_at  │ │  open_rate   │
└──────────────────┘ │  deleted_at      │ │  deleted_at  │ │  click_rate  │
         │           └──────────────────┘ └──────────────┘ │  deleted_at  │
         │                    │                      │      └──────────────┘
         │                    │                      │             │
         │ N:M                │ N:M                  │ 1:N         │
         │                    │                      │             │
         ▼                    │                      └─────────────┤
┌──────────────────┐          │                                    │
│  LIST_CONTACTS   │          │                                    │
├──────────────────┤          │                                    │
│ PK  id           │          │                                    │
│ FK  list_id      │◄─────────┤                                    │
│ FK  contact_id   │◄─────────┘                                    │
│  created_at      │                                               │
└──────────────────┘                                               │
                                                                   │
                                                                   │ N:M
         ┌─────────────────────────────────────────────────────────┤
         │                                                         │
         ▼                                                         │
┌──────────────────┐                                               │
│ CAMPAIGN_LISTS   │                                               │
├──────────────────┤                                               │
│ PK  id           │                                               │
│ FK  campaign_id  │◄──────────────────────────────────────────────┘
│ FK  list_id      │◄──────────────────────────────────────────────┐
│  created_at      │                                               │
└──────────────────┘                                               │
                                                                   │
                                  ┌────────────────────────────────┘
                                  │
         ┌────────────────────────┴─────────────────┐
         │                                          │
         ▼                                          ▼
┌──────────────────────────────────────┐  ┌──────────────────────┐
│        EMAIL_EVENTS TABLE            │  │  CONTACTS (ref)      │
├──────────────────────────────────────┤  └──────────────────────┘
│ PK  id                               │
│ FK  campaign_id ─────────────────────┤
│ FK  contact_id ──────────────────────┤
│     event_type (VARCHAR)             │
│     - sent/delivered/opened/clicked  │
│     - bounced/unsubscribed/complained│
│     user_agent (TEXT)                │
│     ip_address (INET)                │
│     location (VARCHAR)               │
│     device_type (VARCHAR)            │
│     link_url (TEXT)                  │
│     link_text (TEXT)                 │
│     bounce_type (VARCHAR)            │
│     bounce_reason (TEXT)             │
│     metadata (JSONB)                 │
│     created_at (TIMESTAMPTZ)         │
└──────────────────────────────────────┘
```

## Table Relationships Summary

| From Table | Relationship | To Table | Type | Description |
|------------|--------------|----------|------|-------------|
| users | 1:N | lists | One-to-Many | User owns multiple lists |
| users | 1:N | contacts | One-to-Many | User owns multiple contacts |
| users | 1:N | templates | One-to-Many | User creates multiple templates |
| users | 1:N | campaigns | One-to-Many | User creates multiple campaigns |
| lists | N:M | contacts | Many-to-Many | Lists contain multiple contacts, contacts in multiple lists |
| campaigns | N:M | lists | Many-to-Many | Campaigns target multiple lists, lists used in multiple campaigns |
| campaigns | 1:N | email_events | One-to-Many | Campaign generates multiple events |
| contacts | 1:N | email_events | One-to-Many | Contact generates multiple events |
| templates | 1:N | campaigns | One-to-Many | Template used in multiple campaigns |

## Data Flow

### Campaign Creation & Sending

```
1. User creates Campaign
   ↓
2. Campaign linked to Lists (via campaign_lists)
   ↓
3. Campaign optionally linked to Template
   ↓
4. Campaign scheduled (status = 'scheduled')
   ↓
5. Send process begins (status = 'sending')
   ↓
6. For each Contact in selected Lists:
   - Create email_event (type = 'sent')
   - Update campaign.emails_sent
   ↓
7. Campaign sent (status = 'sent')
   ↓
8. Email Events tracked:
   - delivered → emails_delivered++
   - opened → emails_opened++ (unique contacts)
   - clicked → emails_clicked++ (unique contacts)
   - bounced → emails_bounced++
   - unsubscribed → emails_unsubscribed++
   ↓
9. Campaign stats auto-calculated via trigger:
   - open_rate = (emails_opened / emails_delivered) * 100
   - click_rate = (emails_clicked / emails_delivered) * 100
   - bounce_rate = (emails_bounced / emails_sent) * 100
```

### Contact Subscription Flow

```
1. Contact created
   ↓
2. Contact.status = 'subscribed'
   ↓
3. Contact added to List(s) (via list_contacts)
   ↓
4. List.contact_count auto-increments (trigger)
   ↓
5. Contact receives campaigns targeting their lists
   ↓
6. Email Events tracked for engagement
   ↓
7. Contact.last_engaged_at updated
```

## Indexes Strategy

### High-Read Tables
**contacts** - Most queried table
- `idx_contacts_user_id` - Filter by user
- `idx_contacts_email` - Email lookups
- `idx_contacts_status` - Active subscribers
- `idx_contacts_tags` - GIN for tag searches
- `idx_contacts_custom_fields` - GIN for JSON queries

**email_events** - Large volume, frequent queries
- `idx_email_events_campaign_id` - Campaign analytics
- `idx_email_events_contact_id` - Contact engagement
- `idx_email_events_event_type` - Event filtering
- `idx_email_events_created_at` - Time-based queries
- `idx_email_events_campaign_contact` - Composite for unique tracking

### Moderate-Read Tables
**campaigns** - Dashboard queries
- `idx_campaigns_status` - Active/sent campaigns
- `idx_campaigns_scheduled_at` - Queue management
- `idx_campaigns_sent_at` - Historical reports

**lists** - Segmentation
- `idx_lists_user_id` - User's lists
- `idx_lists_deleted_at` - Active lists

## Trigger Automation

### 1. Timestamp Triggers
```sql
BEFORE UPDATE → update_updated_at_column()
```
Applied to: users, lists, contacts, templates, campaigns

### 2. List Count Trigger
```sql
AFTER INSERT/DELETE on list_contacts → update_list_contact_count()
```
Maintains accurate contact_count on lists table

### 3. Campaign Stats Trigger
```sql
AFTER INSERT on email_events → update_campaign_stats()
```
Real-time campaign statistics calculation

## JSON Field Structures

### users.metadata
```json
{
  "onboarding_completed": true,
  "referral_source": "google_ads",
  "utm_campaign": "summer_2024",
  "industry": "ecommerce"
}
```

### users.settings
```json
{
  "timezone": "America/New_York",
  "language": "en",
  "email_notifications": true,
  "marketing_emails": false,
  "default_from_name": "Company Name",
  "default_from_email": "hello@company.com",
  "default_reply_to_email": "support@company.com"
}
```

### contacts.custom_fields
```json
{
  "birthday": "1990-01-15",
  "purchase_count": 5,
  "lifetime_value": 459.99,
  "favorite_category": "electronics",
  "vip_status": true
}
```

### campaigns.metadata
```json
{
  "ab_test_variant": "A",
  "goal": "product_launch",
  "segment": "high_value_customers",
  "utm_source": "email",
  "utm_medium": "campaign",
  "utm_campaign": "summer_sale_2024"
}
```

## Scaling Considerations

### Vertical Scaling (Single Server)
- Up to **10M contacts**: Standard indexes sufficient
- Up to **100M email_events/month**: Consider partitioning

### Horizontal Scaling (Sharding)
- Shard by `user_id` for multi-tenant isolation
- Read replicas for analytics queries
- Separate OLAP database for historical reporting

### Partitioning Strategy
```sql
-- Partition email_events by month
CREATE TABLE email_events_2024_01 PARTITION OF email_events
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE email_events_2024_02 PARTITION OF email_events
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

## Backup & Recovery

### Recommended Strategy
1. **Continuous WAL Archiving**: Point-in-time recovery
2. **Daily Full Backups**: Base backup for restoration
3. **Hourly Incremental**: Minimal data loss
4. **Geo-Redundancy**: Backups in multiple regions

### Critical Tables (Priority 1)
- users
- contacts
- campaigns
- email_events

### Recoverable Tables (Priority 2)
- lists
- templates
- list_contacts
- campaign_lists
