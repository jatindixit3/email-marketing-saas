# Email Warmup System - Complete Guide

Comprehensive guide for the email warmup system that gradually builds sender reputation for new SaaS users.

## Table of Contents

1. [Overview](#overview)
2. [Why Warmup?](#why-warmup)
3. [Warmup Stages](#warmup-stages)
4. [Database Schema](#database-schema)
5. [Services & APIs](#services--apis)
6. [Domain Authentication](#domain-authentication)
7. [Dashboard Components](#dashboard-components)
8. [Usage Examples](#usage-examples)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The email warmup system prevents new SaaS users from being flagged as spammers by gradually increasing their daily send limits over a 15-day period. It includes:

- **Automatic limit progression** based on account age
- **Domain authentication checking** (SPF, DKIM, DMARC, MX)
- **Sender reputation monitoring** with alerts
- **Send enforcement** integrated into email sending logic
- **Beautiful dashboard** with progress tracking

---

## Why Warmup?

**Problem:** Sending large volumes immediately from a new account triggers spam filters and damages sender reputation.

**Solution:** Gradually increase send volume to build trust with email providers (Gmail, Outlook, etc.).

### Benefits:
- ✅ Avoids spam folder placement
- ✅ Builds sender reputation organically
- ✅ Prevents IP/domain blacklisting
- ✅ Improves long-term deliverability
- ✅ Establishes consistent sending patterns

---

## Warmup Stages

### Stage 1: Initial Warmup (Days 0-3)
- **Daily Limit:** 50 emails
- **Focus:** Send to most engaged contacts
- **Goal:** Establish initial reputation

### Stage 2: Growing Volume (Days 4-7)
- **Daily Limit:** 200 emails
- **Focus:** Maintain high engagement rates
- **Goal:** Build positive sending history

### Stage 3: Scaling Up (Days 8-14)
- **Daily Limit:** 1,000 emails
- **Focus:** Expand to broader audience
- **Goal:** Approach full capacity

### Stage 4: Fully Warmed (Day 15+)
- **Daily Limit:** Based on plan (unlimited for most)
- **Focus:** Normal operations
- **Goal:** Maintain reputation

### Automatic Progression

Limits automatically increase as your account ages. The system runs a daily cron job (`update_warmup_stage()`) to upgrade users to the next stage.

---

## Database Schema

### Tables

#### `email_warmup`
Tracks warmup status per user.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- account_created_at: TIMESTAMP
- warmup_start_date: TIMESTAMP
- warmup_completed_at: TIMESTAMP (nullable)
- warmup_stage: INTEGER (1-4)
- is_warmup_active: BOOLEAN
- daily_send_limit: INTEGER
- emails_sent_today: INTEGER
- last_reset_date: DATE
- total_emails_sent: INTEGER
- warmup_emails_sent: INTEGER
- domain: VARCHAR(255)
- spf_verified: BOOLEAN
- dkim_verified: BOOLEAN
- dmarc_verified: BOOLEAN
- last_dns_check_at: TIMESTAMP
```

#### `warmup_daily_history`
Daily send metrics for tracking patterns.

```sql
- id: UUID (primary key)
- user_id: UUID
- date: DATE
- emails_sent: INTEGER
- emails_delivered: INTEGER
- emails_bounced: INTEGER
- emails_complained: INTEGER
- opens: INTEGER
- clicks: INTEGER
- warmup_stage: INTEGER
- daily_limit: INTEGER
- reputation_score: DECIMAL(5,2)
```

#### `domain_authentication`
DNS record verification status.

```sql
- id: UUID (primary key)
- user_id: UUID
- domain: VARCHAR(255)
- spf_record: TEXT
- spf_verified: BOOLEAN
- dkim_record: TEXT
- dkim_verified: BOOLEAN
- dmarc_record: TEXT
- dmarc_verified: BOOLEAN
- mx_records: JSONB
- mx_verified: BOOLEAN
- is_primary: BOOLEAN
- verification_status: VARCHAR(50)
```

#### `warmup_milestones`
Achievement tracking.

```sql
- id: UUID (primary key)
- user_id: UUID
- milestone_type: VARCHAR(50)
- milestone_name: VARCHAR(255)
- milestone_description: TEXT
- achieved_at: TIMESTAMP
- data: JSONB
```

#### `warmup_alerts`
Reputation warnings and notifications.

```sql
- id: UUID (primary key)
- user_id: UUID
- alert_type: VARCHAR(50)
- severity: VARCHAR(20) (info, warning, critical)
- title: VARCHAR(255)
- message: TEXT
- data: JSONB
- is_read: BOOLEAN
- is_resolved: BOOLEAN
```

### Database Functions

```sql
-- Initialize warmup for new users
initialize_warmup_for_user()

-- Reset daily counters (run daily at midnight)
reset_daily_warmup_count()

-- Update warmup stages (run daily)
update_warmup_stage()

-- Calculate reputation score
calculate_reputation_score(user_id, date)

-- Increment send count
increment_warmup_sends(user_id, count)
```

---

## Services & APIs

### Warmup Service

**File:** [lib/services/warmup-service.ts](lib/services/warmup-service.ts)

#### Key Functions:

```typescript
// Get warmup status
getWarmupStatus(userId: string): Promise<WarmupStatus>

// Check if user can send emails
canSendEmails(userId: string, emailCount: number): Promise<{
  allowed: boolean
  reason?: string
  limit?: number
  current?: number
}>

// Track send for warmup
trackWarmupSend(userId: string, emailCount: number): Promise<void>

// Get warmup history
getWarmupHistory(userId: string, days: number): Promise<any[]>

// Get/create alerts
getWarmupAlerts(userId: string, unreadOnly: boolean): Promise<any[]>
createWarmupAlert(userId, type, severity, title, message, data): Promise<void>

// Check reputation and alert
checkReputationAndAlert(userId: string): Promise<void>
```

#### WarmupStatus Interface:

```typescript
interface WarmupStatus {
  userId: string
  stage: number // 1-4
  stageName: string
  dailyLimit: number
  emailsSentToday: number
  remainingToday: number
  isWarmupActive: boolean
  accountAgeDays: number
  nextStageIn: number | null
  progress: number // 0-100%
  dnsAuthStatus: {
    spf: boolean
    dkim: boolean
    dmarc: boolean
    allVerified: boolean
  }
}
```

### Email Sending with Warmup

**File:** [lib/email/send-with-warmup.ts](lib/email/send-with-warmup.ts)

```typescript
// Send single email with warmup check
sendEmailWithWarmup(options: SendEmailOptions): Promise<SendResult>

// Send batch with warmup enforcement
sendBatchWithWarmup(userId, emails): Promise<{
  sent: number
  failed: number
  blocked: number
  errors: string[]
}>

// Send campaign with warmup (partial send if needed)
sendCampaignWithWarmup(userId, campaignId, recipients, content): Promise<{
  sent: number
  failed: number
  blocked: number
  remainingToday: number
}>

// Preview limits before sending
previewSendLimits(userId, emailCount): Promise<{
  canSend: boolean
  allowedCount: number
  blockedCount: number
  message: string
}>
```

---

## Domain Authentication

### DNS Authentication Checker

**File:** [lib/services/dns-authentication.ts](lib/services/dns-authentication.ts)

Checks SPF, DKIM, DMARC, and MX records for a domain.

```typescript
// Check all DNS authentication
checkDomainAuthentication(domain: string, dkimSelector?: string): Promise<DNSAuthResult>

// Validate domain for sending
validateEmailDomain(domain: string): Promise<{
  isValid: boolean
  errors: string[]
  warnings: string[]
  authResult: DNSAuthResult
}>

// Get setup instructions
getDNSSetupInstructions(domain: string): {
  spf: string
  dkim: string
  dmarc: string
}
```

#### DNSAuthResult Interface:

```typescript
interface DNSAuthResult {
  domain: string
  spf: {
    verified: boolean
    record: string | null
    error?: string
  }
  dkim: {
    verified: boolean
    record: string | null
    selector?: string
  }
  dmarc: {
    verified: boolean
    record: string | null
    policy?: string // none, quarantine, reject
  }
  mx: {
    verified: boolean
    records: string[]
  }
  allVerified: boolean
  score: number // 0-100
  recommendations: string[]
}
```

### DNS Records Explained

**SPF (Sender Policy Framework)**
- Authorizes which servers can send email for your domain
- Example: `v=spf1 include:amazonses.com ~all`
- Score contribution: 30 points

**DKIM (DomainKeys Identified Mail)**
- Cryptographic signature proving email authenticity
- Requires email provider to generate keys
- Score contribution: 30 points

**DMARC (Domain-based Message Authentication)**
- Policy for handling failed authentication
- Protects against spoofing
- Policies: none (monitor), quarantine, reject
- Score contribution: 25 points

**MX (Mail Exchange)**
- Allows receiving email replies
- Score contribution: 15 points

---

## Dashboard Components

### 1. Warmup Status Card

**File:** [components/warmup/warmup-status-card.tsx](components/warmup/warmup-status-card.tsx)

Shows current stage, limits, and progress.

```tsx
import { WarmupStatusCard } from '@/components/warmup/warmup-status-card'

<WarmupStatusCard
  status={warmupStatus}
  onViewDetails={() => router.push('/warmup/details')}
/>
```

**Features:**
- Current stage badge (1-4)
- Progress bar (0-100%)
- Daily limit and sent count
- Usage percentage
- Days until next stage
- Warning when approaching limit
- DNS authentication status

---

### 2. Domain Authentication Checker

**File:** [components/warmup/domain-auth-checker.tsx](components/warmup/domain-auth-checker.tsx)

Verify SPF, DKIM, DMARC, MX records.

```tsx
import { DomainAuthChecker } from '@/components/warmup/domain-auth-checker'

<DomainAuthChecker
  domain="yourdomain.com"
  authResult={dnsResults}
  onCheck={async (domain) => {
    const res = await fetch('/api/warmup/check-domain', {
      method: 'POST',
      body: JSON.stringify({ domain })
    })
  }}
  loading={checking}
/>
```

**Features:**
- Authentication score (0-100)
- Individual check status (SPF, DKIM, DMARC, MX)
- DNS record display with copy button
- Setup instructions (toggle)
- Recommendations for fixes

---

### 3. Sender Reputation Tips

**File:** [components/warmup/sender-reputation-tips.tsx](components/warmup/sender-reputation-tips.tsx)

Monitor metrics and get actionable tips.

```tsx
import { SenderReputationTips } from '@/components/warmup/sender-reputation-tips'

<SenderReputationTips
  metrics={{
    bounceRate: 1.2,
    complaintRate: 0.03,
    openRate: 28,
    clickRate: 3.5,
    unsubscribeRate: 0.2,
    reputationScore: 85
  }}
  warmupStage={2}
/>
```

**Features:**
- Overall reputation score
- Metric cards (bounce, complaint, open, click, unsubscribe rates)
- Color-coded status (good/warning/critical)
- Contextual tips based on metrics
- Warmup-specific guidance

---

### 4. Best Practices Guide

**File:** [components/warmup/best-practices-guide.tsx](components/warmup/best-practices-guide.tsx)

Comprehensive email marketing best practices.

```tsx
import { BestPracticesGuide } from '@/components/warmup/best-practices-guide'

<BestPracticesGuide />
```

**Covers:**
- List building & management
- Content & design
- Sending practices
- Technical setup (SPF, DKIM, DMARC)
- Legal compliance (CAN-SPAM, GDPR)
- Engagement optimization
- Pre-send checklist

---

## API Routes

### GET /api/warmup/status

Get warmup status for authenticated user.

```typescript
// Response
{
  success: true,
  data: {
    userId: string,
    stage: number,
    stageName: string,
    dailyLimit: number,
    emailsSentToday: number,
    remainingToday: number,
    isWarmupActive: boolean,
    accountAgeDays: number,
    nextStageIn: number | null,
    progress: number,
    dnsAuthStatus: {
      spf: boolean,
      dkim: boolean,
      dmarc: boolean,
      allVerified: boolean
    }
  }
}
```

### POST /api/warmup/check-domain

Check DNS authentication for a domain.

```typescript
// Request
{
  domain: "yourdomain.com",
  dkimSelector?: "default" // optional
}

// Response
{
  success: true,
  data: {
    domain: string,
    spf: { verified: boolean, record: string | null },
    dkim: { verified: boolean, record: string | null },
    dmarc: { verified: boolean, record: string | null },
    mx: { verified: boolean, records: string[] },
    allVerified: boolean,
    score: number,
    recommendations: string[]
  }
}
```

### GET /api/warmup/history?days=30

Get daily send history for charts.

```typescript
// Response
{
  success: true,
  data: [
    {
      date: "2024-12-14",
      emails_sent: 45,
      emails_delivered: 44,
      emails_bounced: 1,
      opens: 18,
      clicks: 6,
      warmup_stage: 2,
      daily_limit: 200,
      reputation_score: 92.5
    }
  ]
}
```

### GET /api/warmup/alerts?unreadOnly=true

Get warmup alerts.

```typescript
// Response
{
  success: true,
  data: [
    {
      id: string,
      alert_type: "high_bounce_rate",
      severity: "warning",
      title: "High Bounce Rate Detected",
      message: "Your bounce rate is 6.2%. Clean your contact list.",
      data: { bounce_rate: 6.2 },
      is_read: false,
      created_at: string
    }
  ]
}
```

### PATCH /api/warmup/alerts

Mark alert as read.

```typescript
// Request
{
  alertId: string
}

// Response
{
  success: true,
  message: "Alert marked as read"
}
```

---

## Usage Examples

### 1. Check Warmup Before Sending

```typescript
import { canSendEmails } from '@/lib/services/warmup-service'
import { toastError } from '@/lib/utils/toast-helpers'

async function sendCampaign(campaignId: string, recipientCount: number) {
  const userId = 'user-123'

  // Check warmup limits
  const warmupCheck = await canSendEmails(userId, recipientCount)

  if (!warmupCheck.allowed) {
    toastError.error(warmupCheck.reason!)
    return
  }

  // Proceed with sending
  await sendEmails(...)
}
```

### 2. Send with Automatic Warmup Enforcement

```typescript
import { sendCampaignWithWarmup } from '@/lib/email/send-with-warmup'

const result = await sendCampaignWithWarmup(
  userId,
  campaignId,
  recipients,
  {
    from: 'noreply@yourdomain.com',
    subject: 'Your Newsletter',
    htmlBody: '<h1>Hello!</h1>',
    textBody: 'Hello!'
  }
)

console.log(`Sent: ${result.sent}, Failed: ${result.failed}, Blocked: ${result.blocked}`)
console.log(`Remaining today: ${result.remainingToday}`)
```

### 3. Check Domain Authentication

```typescript
import { checkDomainAuthentication } from '@/lib/services/dns-authentication'

const authResult = await checkDomainAuthentication('yourdomain.com')

console.log(`DNS Score: ${authResult.score}/100`)
console.log(`SPF: ${authResult.spf.verified ? '✓' : '✗'}`)
console.log(`DKIM: ${authResult.dkim.verified ? '✓' : '✗'}`)
console.log(`DMARC: ${authResult.dmarc.verified ? '✓' : '✗'}`)

if (!authResult.allVerified) {
  console.log('Recommendations:', authResult.recommendations)
}
```

### 4. Monitor Reputation

```typescript
import { checkReputationAndAlert } from '@/lib/services/warmup-service'

// Run this after each send or daily via cron
await checkReputationAndAlert(userId)

// This automatically creates alerts for:
// - High bounce rates (>5%)
// - Spam complaints (>0.1%)
// - Low engagement during warmup (<10% open rate)
```

---

## Best Practices

### During Warmup (Days 0-14)

1. **Send to Engaged Contacts First**
   - Sort by recent opens/clicks
   - Use subscribers who opted in recently
   - Avoid cold/old contacts

2. **Maintain Consistent Schedule**
   - Send at the same time each day
   - Don't skip days
   - Gradual, steady growth

3. **Monitor Metrics Closely**
   - Check bounce rate daily (keep <2%)
   - Watch for spam complaints (keep <0.1%)
   - Aim for high open rates (>20%)

4. **Respect Limits**
   - Don't try to circumvent warmup limits
   - Use scheduled sends for overflow
   - Plan campaigns around daily limits

5. **Focus on Quality**
   - Send valuable content
   - Perfect your subject lines
   - Test before sending

### Authentication Setup

1. **SPF**
   ```
   v=spf1 include:amazonses.com ~all
   ```
   - Add TXT record at domain root (@)
   - Replace with your email provider's SPF include

2. **DKIM**
   - Generated by email provider (AWS SES, SendGrid, etc.)
   - Add CNAME records as provided
   - Verify in provider dashboard

3. **DMARC**
   ```
   v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; pct=100
   ```
   - Add TXT record at _dmarc subdomain
   - Start with p=none, upgrade to p=quarantine or p=reject

4. **MX**
   - Configure if you want to receive replies
   - Use your email provider's MX records

### List Hygiene

- Remove hard bounces immediately
- Re-engage inactive subscribers (90+ days)
- Validate emails before import
- Use double opt-in
- Clean list quarterly

### Content Best Practices

- Personalize beyond name
- Clear, non-spammy subject lines
- 60% text, 40% images ratio
- Include plain text version
- Test on multiple clients
- Mobile-responsive design

---

## Troubleshooting

### "Daily limit reached"

**Problem:** User hit warmup limit.

**Solutions:**
- Schedule remaining emails for tomorrow
- Check warmup stage and account age
- Verify daily_send_limit in database

### High Bounce Rate

**Problem:** Bounce rate >5%.

**Solutions:**
- Immediately stop sending
- Clean contact list
- Verify email addresses before import
- Check for typos/invalid domains

### Spam Complaints

**Problem:** Users marking emails as spam.

**Solutions:**
- Review email content (avoid spam triggers)
- Ensure proper opt-in process
- Add clear unsubscribe link
- Send only to engaged contacts

### Low Engagement

**Problem:** Open rate <10% during warmup.

**Solutions:**
- Improve subject lines
- Send to more engaged segments
- Check send time optimization
- Verify email isn't landing in spam

### DNS Authentication Failed

**Problem:** SPF/DKIM/DMARC not verified.

**Solutions:**
- Wait 24-48 hours for DNS propagation
- Verify DNS records with `dig` or `nslookup`
- Check for typos in DNS entries
- Contact email provider for DKIM keys

### Warmup Not Progressing

**Problem:** Still at Stage 1 after 4+ days.

**Solutions:**
- Run `update_warmup_stage()` function manually
- Check `warmup_start_date` in database
- Verify cron job is running daily
- Check `is_warmup_active` flag

---

## Cron Jobs

Set up these daily cron jobs:

```bash
# Reset daily send counters (midnight UTC)
0 0 * * * psql -d your_db -c "SELECT reset_daily_warmup_count();"

# Update warmup stages (1 AM UTC)
0 1 * * * psql -d your_db -c "SELECT update_warmup_stage();"

# Check reputation for all active users (2 AM UTC)
0 2 * * * node scripts/check-all-reputations.js
```

Or use Supabase Edge Functions / Vercel Cron:

```typescript
// app/api/cron/warmup-update/route.ts
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await updateAllWarmupStages()

  return NextResponse.json({ success: true })
}
```

---

## File Reference

### Database
- [DATABASE_WARMUP_SCHEMA.sql](DATABASE_WARMUP_SCHEMA.sql) - Schema and triggers
- [DATABASE_WARMUP_FUNCTIONS.sql](DATABASE_WARMUP_FUNCTIONS.sql) - Stored procedures

### Services
- [lib/services/warmup-service.ts](lib/services/warmup-service.ts) - Core warmup logic
- [lib/services/dns-authentication.ts](lib/services/dns-authentication.ts) - DNS checking
- [lib/email/send-with-warmup.ts](lib/email/send-with-warmup.ts) - Email sending with enforcement

### Components
- [components/warmup/warmup-status-card.tsx](components/warmup/warmup-status-card.tsx) - Status display
- [components/warmup/domain-auth-checker.tsx](components/warmup/domain-auth-checker.tsx) - DNS checker UI
- [components/warmup/sender-reputation-tips.tsx](components/warmup/sender-reputation-tips.tsx) - Reputation monitoring
- [components/warmup/best-practices-guide.tsx](components/warmup/best-practices-guide.tsx) - Best practices

### API Routes
- [app/api/warmup/status/route.ts](app/api/warmup/status/route.ts) - Get warmup status
- [app/api/warmup/check-domain/route.ts](app/api/warmup/check-domain/route.ts) - Check DNS
- [app/api/warmup/history/route.ts](app/api/warmup/history/route.ts) - Get history
- [app/api/warmup/alerts/route.ts](app/api/warmup/alerts/route.ts) - Manage alerts

---

## Summary

The email warmup system provides:

✅ **Gradual limit increases** (50 → 200 → 1,000 → unlimited)
✅ **Automatic progression** based on account age
✅ **Send enforcement** with helpful error messages
✅ **DNS authentication** verification and guidance
✅ **Reputation monitoring** with proactive alerts
✅ **Beautiful UI** for tracking progress
✅ **Best practices** guide for success

Your users will build sender reputation organically, avoid spam folders, and achieve excellent long-term deliverability! 🚀
