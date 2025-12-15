# Uptime Monitoring Setup Guide

Complete guide for setting up uptime monitoring with UptimeRobot and Checkly.

## Option 1: UptimeRobot (Free Tier - Recommended)

### Features
- ✅ 50 monitors free
- ✅ 5-minute intervals
- ✅ Email/SMS/Slack alerts
- ✅ Status page
- ✅ Simple setup

### Setup Steps

1. **Create Account**
   - Go to [uptimerobot.com](https://uptimerobot.com)
   - Sign up for free account

2. **Create Monitors**

   Add these endpoints (check every 5 minutes):

   **Homepage**
   - Type: HTTP(s)
   - URL: `https://yourapp.com`
   - Expected Status: 200
   - Alert if down for: 2 minutes

   **Dashboard**
   - Type: HTTP(s)
   - URL: `https://yourapp.com/dashboard`
   - Expected Status: 200 or 301/302 (redirect to login)

   **API Health Check**
   - Type: HTTP(s)
   - URL: `https://yourapp.com/api/health`
   - Expected Status: 200
   - Expected Content: `"status":"healthy"`

   **Database Connection**
   - Type: HTTP(s)
   - URL: `https://yourapp.com/api/health/db`
   - Expected Status: 200

   **Email Service**
   - Type: HTTP(s)
   - URL: `https://yourapp.com/api/health/email`
   - Expected Status: 200

3. **Configure Alerts**
   - Email: Your admin email
   - Slack: (Optional) Add webhook URL
   - SMS: (Optional, paid feature)

4. **Create Status Page**
   - Public status page: `https://stats.uptimerobot.com/yourpage`
   - Add to your website footer

---

## Option 2: Checkly (More Advanced)

### Features
- ✅ API monitoring
- ✅ Browser checks (Playwright)
- ✅ Multi-location checks
- ✅ Detailed performance metrics
- ✅ 5-minute intervals (paid)

### Setup Steps

1. **Create Account**
   - Go to [checklyhq.com](https://www.checklyhq.com)
   - Start free trial

2. **API Checks**

   Create checks for each endpoint:

   ```javascript
   // Homepage Check
   const https = require('https')

   https.get('https://yourapp.com', (res) => {
     if (res.statusCode !== 200) {
       throw new Error(`Expected 200, got ${res.statusCode}`)
     }
   })
   ```

3. **Browser Checks** (Critical User Flows)

   ```javascript
   // Login Flow Check
   const { chromium } = require('playwright')

   const browser = await chromium.launch()
   const page = await browser.newPage()

   await page.goto('https://yourapp.com/login')
   await page.fill('[name="email"]', 'test@example.com')
   await page.fill('[name="password"]', 'password')
   await page.click('button[type="submit"]')

   await page.waitForURL('**/dashboard')

   await browser.close()
   ```

4. **Alert Channels**
   - Email
   - Slack webhook
   - PagerDuty (for on-call)

---

## Health Check Endpoints

Create these API routes for monitoring:

### 1. Basic Health Check

**File:** `app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
}
```

### 2. Database Health Check

**File:** `app/api/health/db/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Simple query to check connection
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (error) throw error

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
```

### 3. Email Service Health Check

**File:** `app/api/health/email/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { SESClient, GetSendQuotaCommand } from '@aws-sdk/client-ses'

export async function GET() {
  try {
    const ses = new SESClient({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })

    // Check SES quota
    const command = new GetSendQuotaCommand({})
    await ses.send(command)

    return NextResponse.json({
      status: 'healthy',
      emailService: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        emailService: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
```

---

## Recommended Monitoring Setup

### Endpoints to Monitor

| Endpoint | Interval | Alert After |
|----------|----------|-------------|
| Homepage | 5 min | 2 minutes down |
| /api/health | 5 min | 2 minutes down |
| /api/health/db | 5 min | 1 minute down |
| /api/health/email | 10 min | 5 minutes down |
| Dashboard (auth) | 10 min | 5 minutes down |

### Alert Channels

1. **Critical** (immediate)
   - Database down
   - API health check fails
   - PagerDuty/phone call

2. **High** (within 5 minutes)
   - Homepage down
   - Email service down
   - Slack alert

3. **Medium** (within 15 minutes)
   - Dashboard slow (>3s load time)
   - Email notification

### Status Page

Create a public status page showing:
- ✅ All systems operational
- ⚠️ Degraded performance
- ❌ Major outage
- 📊 90-day uptime percentage

---

## Monitoring Checklist

Before going live:

- [ ] Set up homepage monitoring
- [ ] Set up API health check
- [ ] Set up database health check
- [ ] Set up email service health check
- [ ] Configure alert emails
- [ ] Add Slack webhook for critical alerts
- [ ] Create public status page
- [ ] Test alert notifications
- [ ] Document incident response procedures
- [ ] Set up on-call rotation (if team)

---

## Incident Response Procedures

### When Alert Fires

1. **Acknowledge Alert** (within 5 minutes)
   - Mark alert as acknowledged
   - Update status page

2. **Investigate** (within 10 minutes)
   - Check error logs
   - Check Sentry for errors
   - Check server/database status
   - Check external dependencies

3. **Communicate**
   - Update status page with details
   - Post in team Slack
   - Email affected customers if needed

4. **Resolve**
   - Fix the issue
   - Verify fix with manual test
   - Wait for monitoring to confirm

5. **Post-Mortem**
   - Document what happened
   - Why it happened
   - How we fixed it
   - How to prevent it

---

## Integration with Slack

### UptimeRobot Slack Webhook

1. Create Slack Incoming Webhook
2. Add to UptimeRobot alerts
3. Format: `https://hooks.slack.com/services/YOUR/WEBHOOK/URL`

### Checkly Slack Integration

1. Install Checkly Slack app
2. Authorize workspace
3. Choose channel for alerts

---

## Cost Comparison

| Service | Free Tier | Paid (Recommended) |
|---------|-----------|-------------------|
| UptimeRobot | 50 monitors, 5-min | $7/mo for 1-min |
| Checkly | 5 checks, 10-min | $29/mo for 5-min |
| PagerDuty | 14-day trial | $21/user/mo |

**Recommendation:** Start with UptimeRobot free tier, upgrade to paid for 1-minute intervals when revenue > $1k MRR.

---

## Example UptimeRobot API Integration

Monitor status programmatically:

```typescript
// Get monitor status
const response = await fetch(
  'https://api.uptimerobot.com/v2/getMonitors',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: process.env.UPTIMEROBOT_API_KEY,
      format: 'json',
    }),
  }
)

const data = await response.json()

// Display on your admin dashboard
const uptime = data.monitors[0].average_response_time
const status = data.monitors[0].status // 2 = up, 9 = down
```

---

## Next Steps

1. Create health check endpoints
2. Sign up for UptimeRobot
3. Add all critical endpoints
4. Configure Slack alerts
5. Create public status page
6. Test alerts
7. Document procedures
