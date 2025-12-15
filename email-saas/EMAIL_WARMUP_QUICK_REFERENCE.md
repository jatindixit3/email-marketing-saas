# Email Warmup - Quick Reference

Quick snippets and examples for implementing the email warmup system.

## 🚀 Quick Start

### 1. Run Database Migrations

```bash
# Run the warmup schema
psql -d your_database < DATABASE_WARMUP_SCHEMA.sql

# Run the functions
psql -d your_database < DATABASE_WARMUP_FUNCTIONS.sql
```

### 2. Check Warmup Status

```typescript
import { getWarmupStatus } from '@/lib/services/warmup-service'

const status = await getWarmupStatus(userId)
console.log(`Stage ${status.stage}: ${status.remainingToday} emails remaining`)
```

### 3. Send with Warmup Enforcement

```typescript
import { sendCampaignWithWarmup } from '@/lib/email/send-with-warmup'

const result = await sendCampaignWithWarmup(
  userId,
  campaignId,
  recipients,
  emailContent
)

console.log(`Sent: ${result.sent}, Blocked: ${result.blocked}`)
```

---

## 📊 Warmup Stages Cheat Sheet

| Stage | Days | Daily Limit | What to Send |
|-------|------|-------------|--------------|
| 1 | 0-3 | 50 | Most engaged contacts |
| 2 | 4-7 | 200 | Recent subscribers |
| 3 | 8-14 | 1,000 | Broader audience |
| 4 | 15+ | Plan limit | Normal operations |

---

## 🔍 Check Before Sending

```typescript
import { canSendEmails } from '@/lib/services/warmup-service'

const { allowed, reason, limit, current } = await canSendEmails(userId, 500)

if (!allowed) {
  console.log(`Blocked: ${reason}`)
  console.log(`Limit: ${limit}, Already sent: ${current}`)
}
```

---

## 🌐 Check Domain Authentication

```typescript
import { checkDomainAuthentication } from '@/lib/services/dns-authentication'

const auth = await checkDomainAuthentication('yourdomain.com')

console.log(`Score: ${auth.score}/100`)
console.log(`SPF: ${auth.spf.verified ? '✓' : '✗'}`)
console.log(`DKIM: ${auth.dkim.verified ? '✓' : '✗'}`)
console.log(`DMARC: ${auth.dmarc.verified ? '✓' : '✗'}`)
console.log(`MX: ${auth.mx.verified ? '✓' : '✗'}`)

if (auth.recommendations.length > 0) {
  console.log('Fix:', auth.recommendations)
}
```

---

## 🎯 DNS Records Setup

### SPF
```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all
TTL: 3600
```

### DKIM
```
Type: CNAME
Name: <selector>._domainkey
Value: <provided-by-email-provider>
TTL: 3600
```

### DMARC
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; pct=100
TTL: 3600
```

---

## 📈 Monitor Reputation

```typescript
import { checkReputationAndAlert } from '@/lib/services/warmup-service'

// Run daily or after each send
await checkReputationAndAlert(userId)

// Automatically creates alerts for:
// - Bounce rate >5%
// - Spam complaints >0.1%
// - Low engagement during warmup
```

---

## 🚨 Handle Warmup Errors

```typescript
import { sendEmailWithWarmup } from '@/lib/email/send-with-warmup'
import { toastError } from '@/lib/utils/toast-helpers'

const result = await sendEmailWithWarmup(options)

if (result.blockedByWarmup) {
  toastError.error(`Daily limit reached. ${result.warmupInfo?.remaining} remaining.`)

  // Option 1: Schedule for tomorrow
  await scheduleCampaign(campaignId, tomorrow)

  // Option 2: Send partial
  const allowed = result.warmupInfo?.remaining || 0
  await sendPartialCampaign(campaignId, allowed)
}
```

---

## 📱 Dashboard Components

### Warmup Status Card

```tsx
import { WarmupStatusCard } from '@/components/warmup/warmup-status-card'

<WarmupStatusCard
  status={warmupStatus}
  onViewDetails={() => router.push('/warmup')}
/>
```

### Domain Auth Checker

```tsx
import { DomainAuthChecker } from '@/components/warmup/domain-auth-checker'

<DomainAuthChecker
  domain="yourdomain.com"
  onCheck={async (domain) => {
    const res = await fetch('/api/warmup/check-domain', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    })
    const data = await res.json()
    setAuthResult(data.data)
  }}
/>
```

### Reputation Tips

```tsx
import { SenderReputationTips } from '@/components/warmup/sender-reputation-tips'

<SenderReputationTips
  metrics={{
    bounceRate: 1.2,
    complaintRate: 0.03,
    openRate: 28,
    clickRate: 3.5,
    unsubscribeRate: 0.2,
    reputationScore: 85,
  }}
  warmupStage={2}
/>
```

### Best Practices Guide

```tsx
import { BestPracticesGuide } from '@/components/warmup/best-practices-guide'

<BestPracticesGuide />
```

---

## 🔧 API Routes

### Get Warmup Status
```bash
GET /api/warmup/status
```

### Check Domain DNS
```bash
POST /api/warmup/check-domain
Body: { "domain": "yourdomain.com" }
```

### Get Daily History
```bash
GET /api/warmup/history?days=30
```

### Get Alerts
```bash
GET /api/warmup/alerts?unreadOnly=true
```

### Mark Alert as Read
```bash
PATCH /api/warmup/alerts
Body: { "alertId": "uuid" }
```

---

## ⚠️ Metric Thresholds

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Bounce Rate | <2% | 2-5% | >5% |
| Spam Complaints | <0.05% | 0.05-0.1% | >0.1% |
| Open Rate | >20% | 10-20% | <10% |
| Unsubscribe Rate | <0.5% | 0.5-1% | >1% |
| Reputation Score | >80 | 60-80 | <60 |

---

## 🎯 Best Practices Checklist

### Before Every Send
- [ ] Check warmup limits
- [ ] Verify DNS authentication
- [ ] Send to engaged contacts
- [ ] Test email on multiple clients
- [ ] Include unsubscribe link
- [ ] Add physical address to footer
- [ ] Validate all links work
- [ ] Mobile-responsive design
- [ ] Subject line not spammy
- [ ] Content provides value

### During Warmup (Days 0-14)
- [ ] Send to most engaged first
- [ ] Maintain consistent schedule
- [ ] Monitor bounce rate (<2%)
- [ ] Check spam complaints (<0.1%)
- [ ] Track open rates (>20%)
- [ ] Respect daily limits
- [ ] Don't skip days
- [ ] Focus on quality content

### After Warmup (Day 15+)
- [ ] Continue monitoring metrics
- [ ] Clean list quarterly
- [ ] Re-engage inactive subscribers
- [ ] A/B test campaigns
- [ ] Segment audience
- [ ] Personalize content
- [ ] Optimize send times

---

## 🔄 Daily Cron Jobs

```typescript
// Reset daily counters (midnight UTC)
await supabase.rpc('reset_daily_warmup_count')

// Update warmup stages (1 AM UTC)
await supabase.rpc('update_warmup_stage')

// Check all user reputations (2 AM UTC)
const users = await getActiveUsers()
for (const user of users) {
  await checkReputationAndAlert(user.id)
}
```

---

## 🐛 Common Issues & Fixes

### Issue: "Daily limit reached"
**Fix:**
```typescript
const status = await getWarmupStatus(userId)
const resetTime = new Date()
resetTime.setUTCHours(24, 0, 0, 0)
const hoursUntilReset = (resetTime.getTime() - Date.now()) / (1000 * 60 * 60)

console.log(`Limit resets in ${hoursUntilReset.toFixed(1)} hours`)
```

### Issue: High bounce rate
**Fix:**
```sql
-- Remove hard bounces immediately
DELETE FROM contacts WHERE email IN (
  SELECT recipient_email FROM email_events
  WHERE event_type = 'bounce' AND bounce_type = 'hard'
);
```

### Issue: DNS not verifying
**Fix:**
```bash
# Check DNS propagation
dig TXT yourdomain.com
dig TXT _dmarc.yourdomain.com
dig CNAME default._domainkey.yourdomain.com
dig MX yourdomain.com

# Wait 24-48 hours for propagation
```

### Issue: Warmup not progressing
**Fix:**
```sql
-- Manually update stage (if needed)
UPDATE email_warmup
SET warmup_stage = 2, daily_send_limit = 200
WHERE user_id = 'user-id'
  AND EXTRACT(DAY FROM NOW() - warmup_start_date) >= 4;
```

---

## 📚 Quick Links

- [Full Documentation](EMAIL_WARMUP_GUIDE.md)
- [UX States Guide](UX_STATES_GUIDE.md)
- [Error Handling Guide](ERROR_HANDLING_GUIDE.md)

---

## 💡 Pro Tips

1. **Start Small**: Even if you have 100k contacts, start with 50/day
2. **Engaged First**: Sort by recent opens/clicks for warmup sends
3. **Consistent Timing**: Send at the same hour each day
4. **Monitor Daily**: Check bounce/complaint rates every morning
5. **Perfect Content**: Use warmup period to refine your messaging
6. **Test Everything**: Preview emails in multiple clients before sending
7. **Clean Regularly**: Remove bounces immediately, old contacts quarterly
8. **Segment Smart**: Different messages for different audience segments
9. **Personalize**: Beyond {{firstName}} - use behavior and preferences
10. **Stay Compliant**: GDPR, CAN-SPAM, and local laws must be followed

---

For complete details, see [EMAIL_WARMUP_GUIDE.md](EMAIL_WARMUP_GUIDE.md)
