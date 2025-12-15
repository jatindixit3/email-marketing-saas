# Production Monitoring Guide - Email Marketing SaaS

Complete guide for monitoring your SaaS application in production.

## Table of Contents

1. [Overview](#overview)
2. [Error Tracking (Sentry)](#error-tracking-sentry)
3. [Performance Monitoring](#performance-monitoring)
4. [Uptime Monitoring](#uptime-monitoring)
5. [Business Metrics](#business-metrics)
6. [Structured Logging](#structured-logging)
7. [Setup & Configuration](#setup--configuration)
8. [Dashboard & Alerts](#dashboard--alerts)
9. [Best Practices](#best-practices)

---

## Overview

### What Gets Monitored

- ✅ **Errors** - Exceptions, API failures, crashes (Sentry)
- ✅ **Performance** - Page loads, API latency, database queries
- ✅ **Uptime** - Endpoint availability (UptimeRobot/Checkly)
- ✅ **Business Metrics** - Signups, MRR, churn, email volume
- ✅ **Logs** - Structured JSON logs with request tracing

### Tech Stack

- **Sentry** - Error tracking & performance
- **Vercel Analytics** - Web vitals & page views
- **UptimeRobot** - Uptime monitoring (free tier)
- **Custom** - Business metrics & structured logging

---

## Error Tracking (Sentry)

### Features

- Real-time error alerts
- Stack traces with source maps
- User context (who experienced the error)
- Error grouping and trends
- Session replay on errors
- Performance tracing

### Setup

1. **Create Sentry Account**
   ```bash
   # Go to sentry.io and create project
   # Get your DSN
   ```

2. **Add to Environment Variables**
   ```bash
   # .env.local
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
   ```

3. **Configuration Files**
   - [sentry.client.config.ts](sentry.client.config.ts) - Browser errors
   - [sentry.server.config.ts](sentry.server.config.ts) - API/server errors
   - [sentry.edge.config.ts](sentry.edge.config.ts) - Edge runtime errors

### Error Boundaries

**File:** [lib/monitoring/error-boundary.tsx](lib/monitoring/error-boundary.tsx)

```tsx
import { ErrorBoundary } from '@/lib/monitoring/error-boundary'

// Wrap entire app
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Wrap individual pages
<PageErrorBoundary>
  <DashboardPage />
</PageErrorBoundary>

// Wrap components
<ComponentErrorBoundary>
  <CampaignList />
</ComponentErrorBoundary>
```

### Manual Error Reporting

```typescript
import { useErrorReporting } from '@/lib/monitoring/error-boundary'

function MyComponent() {
  const { reportError, reportMessage } = useErrorReporting()

  try {
    // ... code
  } catch (error) {
    reportError(error as Error, {
      component: 'MyComponent',
      action: 'submitForm',
    })
  }
}
```

### Error Filtering

Configured in `sentry.client.config.ts`:

**Ignored Errors:**
- Browser extension errors
- Network errors (user connectivity)
- ResizeObserver errors
- Third-party script errors

**Filtered URLs:**
- `chrome-extension://`
- `moz-extension://`
- Safari extensions

---

## Performance Monitoring

### Metrics Tracked

1. **Page Performance**
   - Load time
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Time to Interactive (TTI)
   - Cumulative Layout Shift (CLS)

2. **API Performance**
   - Response time
   - Status codes
   - Error rates
   - Slow endpoints (>2s)

3. **Database Performance**
   - Query time
   - Rows affected
   - Slow queries (>1s)

4. **Resource Loading**
   - Script load time
   - Stylesheet load time
   - Image sizes

### Usage

**File:** [lib/monitoring/performance.ts](lib/monitoring/performance.ts)

#### Track Custom Metrics

```typescript
import { trackMetric } from '@/lib/monitoring/performance'

trackMetric({
  name: 'campaign.creation_time',
  value: 1234,
  unit: 'ms',
  tags: {
    userId: 'user-123',
    campaignType: 'newsletter',
  },
})
```

#### Measure Function Performance

```typescript
import { measureAsync } from '@/lib/monitoring/performance'

const result = await measureAsync(
  'database.fetchCampaigns',
  async () => {
    return await supabase.from('campaigns').select('*')
  },
  { userId: 'user-123' }
)
```

#### Track API Calls

```typescript
import { trackAPICall } from '@/lib/monitoring/performance'

const start = Date.now()
const response = await fetch('/api/campaigns')
const duration = Date.now() - start

trackAPICall('/api/campaigns', 'GET', duration, response.status)
```

#### Track Database Queries

```typescript
import { trackDatabaseQuery } from '@/lib/monitoring/performance'

const start = Date.now()
const { data } = await supabase.from('campaigns').select('*')
const duration = Date.now() - start

trackDatabaseQuery('select', 'campaigns', duration, data?.length)
```

#### Performance Timer

```typescript
import { PerformanceTimer } from '@/lib/monitoring/performance'

const timer = new PerformanceTimer('campaign.send', {
  userId: 'user-123',
})

// ... do work
timer.lap('prepared')

// ... do more work
timer.lap('sent')

const totalDuration = timer.end()
```

### Web Vitals

Automatically tracked when using Vercel Analytics:

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### Alert Thresholds

- **Slow API call:** >2 seconds → Warning in Sentry
- **Slow database query:** >1 second → Warning in Sentry
- **High memory usage:** >80% → Warning in Sentry

---

## Uptime Monitoring

See [UPTIME_MONITORING_SETUP.md](UPTIME_MONITORING_SETUP.md) for complete guide.

### Monitored Endpoints

| Endpoint | Purpose | Interval |
|----------|---------|----------|
| `/` | Homepage availability | 5 min |
| `/api/health` | Basic health check | 5 min |
| `/api/health/db` | Database connection | 5 min |
| `/api/health/email` | Email service status | 10 min |
| `/dashboard` | Dashboard availability | 10 min |

### Health Check Responses

**Healthy:**
```json
{
  "status": "healthy",
  "database": "connected",
  "latency": "45ms",
  "timestamp": "2024-12-14T10:30:00Z"
}
```

**Unhealthy:**
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "Connection timeout",
  "timestamp": "2024-12-14T10:30:00Z"
}
```

### Alert Channels

1. **Email** - All downtimes
2. **Slack** - Critical alerts (#alerts channel)
3. **SMS** - Database/Email service down (paid feature)

---

## Business Metrics

Track key business KPIs for product decisions.

**File:** [lib/monitoring/business-metrics.ts](lib/monitoring/business-metrics.ts)

### Tracked Metrics

1. **Signups** - Daily new users
2. **MRR** - Monthly Recurring Revenue
3. **Churn Rate** - Percentage of users canceling
4. **Email Volume** - Total emails sent/delivered/bounced
5. **Active Users** - Users who sent emails this period
6. **Revenue** - Total revenue from payments

### Usage

#### Track Signup

```typescript
import { trackSignup } from '@/lib/monitoring/business-metrics'

await trackSignup(userId, email, 'free')
```

#### Track Subscription Change

```typescript
import { trackSubscriptionChange } from '@/lib/monitoring/business-metrics'

await trackSubscriptionChange(
  userId,
  'free', // previous plan
  'pro', // new plan
  29 // new MRR
)
```

#### Track Email Sends

```typescript
import { trackEmailSend } from '@/lib/monitoring/business-metrics'

await trackEmailSend(
  userId,
  campaignId,
  1000, // total sent
  980, // delivered
  20 // bounced
)
```

#### Get Daily Metrics

```typescript
import { getDailyMetrics } from '@/lib/monitoring/business-metrics'

const metrics = await getDailyMetrics('2024-12-14')

console.log(metrics.signups) // 45
console.log(metrics.mrr) // 12500
console.log(metrics.emailsSent) // 15000
```

#### Calculate Churn Rate

```typescript
import { calculateChurnRate } from '@/lib/monitoring/business-metrics'

const churnRate = await calculateChurnRate(
  '2024-11-01', // start
  '2024-12-01' // end
)

console.log(`Churn rate: ${churnRate}%`)
```

#### Get Growth Metrics

```typescript
import { getGrowthMetrics } from '@/lib/monitoring/business-metrics'

const growth = await getGrowthMetrics('month')

console.log(`Signup growth: ${growth.signupGrowth}%`)
console.log(`Revenue growth: ${growth.revenueGrowth}%`)
```

### Database Schema

Required table:

```sql
CREATE TABLE IF NOT EXISTS business_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_business_events_type_date
  ON business_events(event_type, created_at DESC);
```

---

## Structured Logging

JSON-formatted logs with request IDs for tracing.

**File:** [lib/monitoring/structured-logger.ts](lib/monitoring/structured-logger.ts)

### Log Levels

- `debug` - Development only, detailed debugging
- `info` - General information (API calls, user actions)
- `warn` - Warning messages (high latency, deprecated usage)
- `error` - Error messages (failures, exceptions)
- `fatal` - Critical errors (application crash)

### Usage

#### Basic Logging

```typescript
import { logger } from '@/lib/monitoring/structured-logger'

logger.info('User logged in', {
  userId: 'user-123',
  userEmail: 'user@example.com',
})

logger.error('Failed to send email', {
  userId: 'user-123',
  campaignId: 'camp-456',
  error: new Error('SMTP timeout'),
})
```

#### HTTP Request Logging

```typescript
logger.httpRequest(
  'POST',
  '/api/campaigns',
  200,
  245, // duration in ms
  {
    userId: 'user-123',
    requestId: 'req-789',
  }
)
```

#### Database Query Logging

```typescript
logger.dbQuery(
  'select',
  'campaigns',
  125, // duration
  15, // row count
  {
    userId: 'user-123',
  }
)
```

#### User Action Logging

```typescript
logger.userAction('campaign_sent', 'user-123', {
  campaignId: 'camp-456',
  recipientCount: 1000,
})
```

#### Business Event Logging

```typescript
logger.businessEvent('subscription_upgraded', {
  userId: 'user-123',
  from: 'free',
  to: 'pro',
  mrr: 29,
})
```

#### Child Logger (Preset Context)

```typescript
import { createUserLogger } from '@/lib/monitoring/structured-logger'

const userLogger = createUserLogger('user-123', 'user@example.com')

userLogger.info('Created campaign')
// Automatically includes userId and userEmail
```

#### Request ID Tracing

```typescript
import { withRequestId } from '@/lib/monitoring/structured-logger'

withRequestId((logger, requestId) => {
  logger.info('Processing request')
  // All logs will include requestId

  // ... do work

  logger.info('Request completed')
})
```

### Log Format

**Development:**
```
ℹ️ [INFO] User logged in { userId: 'user-123', userEmail: 'user@example.com' }
```

**Production (JSON):**
```json
{
  "timestamp": "2024-12-14T10:30:00.000Z",
  "level": "info",
  "message": "User logged in",
  "context": {
    "userId": "user-123",
    "userEmail": "user@example.com",
    "requestId": "req-789"
  },
  "environment": "production",
  "service": "email-saas"
}
```

### Integration with Logging Services

Production logs can be sent to:
- **Vercel Logs** - Automatic in Vercel deployments
- **Datadog** - Add Datadog integration
- **LogRocket** - Session replay with logs
- **Papertrail** - Log aggregation

---

## Setup & Configuration

### 1. Install Dependencies

```bash
npm install @sentry/nextjs @vercel/analytics @vercel/speed-insights uuid
```

### 2. Environment Variables

```bash
# .env.local

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx

# Vercel (automatic in Vercel deployments)
# No additional config needed

# UptimeRobot (optional, for programmatic access)
UPTIMEROBOT_API_KEY=your_api_key
```

### 3. Sentry Configuration

Files already created:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

### 4. Add Analytics to Layout

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ErrorBoundary } from '@/lib/monitoring/error-boundary'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### 5. Set Up Uptime Monitoring

See [UPTIME_MONITORING_SETUP.md](UPTIME_MONITORING_SETUP.md)

### 6. Create Business Metrics Table

```sql
CREATE TABLE IF NOT EXISTS business_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_business_events_type_date
  ON business_events(event_type, created_at DESC);
CREATE INDEX idx_business_events_user
  ON business_events(user_id);
```

---

## Dashboard & Alerts

### Sentry Dashboard

**Issues Tab** - See all errors grouped
- Filter by environment (production/development)
- Filter by user
- Sort by frequency, last seen, first seen

**Performance Tab** - See slow transactions
- API endpoints by response time
- Database queries by duration
- Frontend page loads

**Releases Tab** - Track errors by deployment
- Compare error rates across releases
- See which deploy introduced bugs

**Alerts** - Set up in Sentry
- New issue in production → Slack
- Error rate > 10/min → Email
- High latency (P95 > 2s) → Slack

### Vercel Analytics

Dashboard shows:
- Page views
- Unique visitors
- Top pages
- Referrers
- Web Vitals scores (LCP, FID, CLS)

Access: `vercel.com/your-project/analytics`

### UptimeRobot Dashboard

**Monitors Tab** - See all endpoints
- Uptime percentage (30/60/90 day)
- Response time graph
- Recent downtimes

**Alert Contacts** - Configure notifications
- Email alerts
- Slack webhooks
- SMS (paid)

**Public Status Page** - Share with users
- All systems operational status
- Incident history
- Subscribe to updates

### Custom Monitoring Dashboard

Create admin dashboard at `/admin/monitoring`:

```tsx
// app/admin/monitoring/page.tsx
import { getDailyMetrics } from '@/lib/monitoring/business-metrics'

export default async function MonitoringPage() {
  const today = new Date().toISOString().split('T')[0]
  const metrics = await getDailyMetrics(today)

  return (
    <div>
      <h1>Business Metrics</h1>
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Signups" value={metrics.signups} />
        <MetricCard label="MRR" value={`$${metrics.mrr}`} />
        <MetricCard label="Emails Sent" value={metrics.emailsSent} />
        <MetricCard label="Campaigns" value={metrics.campaignsSent} />
      </div>
    </div>
  )
}
```

---

## Best Practices

### Error Tracking

1. **Use Error Boundaries** - Wrap all major components
2. **Add User Context** - Always include userId in errors
3. **Filter Noise** - Ignore browser extensions, network errors
4. **Group Errors** - Use Sentry's fingerprinting for better grouping
5. **Set Severity** - Use appropriate log levels (error vs warning)

### Performance

1. **Track Critical Paths** - Measure important user flows
2. **Set Budgets** - Alert if API latency > 2s
3. **Monitor Database** - Watch for slow queries (>1s)
4. **Web Vitals** - Keep LCP < 2.5s, CLS < 0.1
5. **Regular Review** - Check performance dashboard weekly

### Uptime

1. **Multiple Checks** - Monitor all critical endpoints
2. **Short Intervals** - 5-minute checks for critical paths
3. **Quick Alerts** - Alert after 2 minutes down
4. **Status Page** - Keep users informed of incidents
5. **Test Alerts** - Verify notifications work

### Business Metrics

1. **Daily Review** - Check key metrics every morning
2. **Set Goals** - Track progress towards targets
3. **Trend Analysis** - Watch week-over-week growth
4. **Anomaly Detection** - Alert on unusual patterns
5. **Export Data** - Regular backups of metrics

### Logging

1. **Consistent Format** - Always use structured logger
2. **Request IDs** - Include in all related logs
3. **Appropriate Levels** - Don't log info as error
4. **Privacy** - Never log passwords, tokens
5. **Retention** - Set log retention policy (30-90 days)

---

## File Reference

### Error Tracking
- [sentry.client.config.ts](sentry.client.config.ts) - Browser Sentry config
- [sentry.server.config.ts](sentry.server.config.ts) - Server Sentry config
- [sentry.edge.config.ts](sentry.edge.config.ts) - Edge Sentry config
- [lib/monitoring/error-boundary.tsx](lib/monitoring/error-boundary.tsx) - Error boundaries

### Performance
- [lib/monitoring/performance.ts](lib/monitoring/performance.ts) - Performance tracking

### Business Metrics
- [lib/monitoring/business-metrics.ts](lib/monitoring/business-metrics.ts) - KPI tracking

### Logging
- [lib/monitoring/structured-logger.ts](lib/monitoring/structured-logger.ts) - JSON logging

### Health Checks
- [app/api/health/route.ts](app/api/health/route.ts) - Basic health
- [app/api/health/db/route.ts](app/api/health/db/route.ts) - Database health
- [app/api/health/email/route.ts](app/api/health/email/route.ts) - Email service health

### Documentation
- [UPTIME_MONITORING_SETUP.md](UPTIME_MONITORING_SETUP.md) - Uptime setup guide

---

## Summary

Your SaaS now has **production-grade monitoring**:

✅ **Error Tracking** - Sentry with source maps, user context, session replay
✅ **Performance Monitoring** - API, database, page load tracking
✅ **Uptime Monitoring** - Health checks every 5 minutes
✅ **Business Metrics** - Signups, MRR, churn, email volume
✅ **Structured Logging** - JSON logs with request tracing
✅ **Alerting** - Email, Slack, SMS for critical issues
✅ **Dashboards** - Sentry, Vercel, UptimeRobot, custom admin

You'll know immediately when something breaks and have the data to fix it quickly! 🚀
