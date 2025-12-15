# Production Monitoring - Quick Reference

Quick snippets for common monitoring tasks.

## 🚨 Error Tracking

### Report Error Manually
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.captureException(error, {
  extra: { userId: 'user-123', action: 'send_campaign' }
})
```

### Wrap Component with Error Boundary
```tsx
import { ErrorBoundary } from '@/lib/monitoring/error-boundary'

<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

### Use Error Reporting Hook
```typescript
import { useErrorReporting } from '@/lib/monitoring/error-boundary'

const { reportError } = useErrorReporting()

try {
  await sendEmail()
} catch (error) {
  reportError(error as Error, { campaignId: 'camp-123' })
}
```

---

## ⚡ Performance Tracking

### Track Custom Metric
```typescript
import { trackMetric } from '@/lib/monitoring/performance'

trackMetric({
  name: 'campaign.send_duration',
  value: 1234,
  unit: 'ms',
  tags: { userId: 'user-123' }
})
```

### Measure Async Function
```typescript
import { measureAsync } from '@/lib/monitoring/performance'

const result = await measureAsync(
  'database.query',
  async () => await supabase.from('campaigns').select('*'),
  { table: 'campaigns' }
)
```

### Track API Call
```typescript
import { trackAPICall } from '@/lib/monitoring/performance'

const start = Date.now()
const res = await fetch('/api/campaigns')
trackAPICall('/api/campaigns', 'GET', Date.now() - start, res.status)
```

### Track Database Query
```typescript
import { trackDatabaseQuery } from '@/lib/monitoring/performance'

const start = Date.now()
const { data } = await supabase.from('campaigns').select('*')
trackDatabaseQuery('select', 'campaigns', Date.now() - start, data?.length)
```

---

## 📊 Business Metrics

### Track Signup
```typescript
import { trackSignup } from '@/lib/monitoring/business-metrics'

await trackSignup(userId, email, 'free')
```

### Track Subscription Change
```typescript
import { trackSubscriptionChange } from '@/lib/monitoring/business-metrics'

await trackSubscriptionChange(userId, 'free', 'pro', 29)
```

### Track Email Send
```typescript
import { trackEmailSend } from '@/lib/monitoring/business-metrics'

await trackEmailSend(userId, campaignId, 1000, 980, 20)
```

### Get Daily Metrics
```typescript
import { getDailyMetrics } from '@/lib/monitoring/business-metrics'

const metrics = await getDailyMetrics('2024-12-14')
console.log(metrics.signups, metrics.mrr, metrics.emailsSent)
```

---

## 📝 Structured Logging

### Basic Logging
```typescript
import { logger } from '@/lib/monitoring/structured-logger'

logger.info('User logged in', { userId: 'user-123' })
logger.warn('High latency detected', { duration: 2500 })
logger.error('Failed to send email', { error: new Error('Timeout') })
```

### HTTP Request Logging
```typescript
logger.httpRequest('POST', '/api/campaigns', 200, 245, {
  userId: 'user-123',
  requestId: 'req-789'
})
```

### Database Query Logging
```typescript
logger.dbQuery('select', 'campaigns', 125, 15, { userId: 'user-123' })
```

### User Action Logging
```typescript
logger.userAction('campaign_sent', 'user-123', {
  campaignId: 'camp-456',
  recipientCount: 1000
})
```

### Child Logger (Preset Context)
```typescript
import { createUserLogger } from '@/lib/monitoring/structured-logger'

const userLogger = createUserLogger('user-123', 'user@example.com')
userLogger.info('Created campaign') // Auto-includes userId & email
```

---

## 🏥 Health Checks

### Check Endpoints

```bash
# Basic health
curl https://yourapp.com/api/health

# Database health
curl https://yourapp.com/api/health/db

# Email service health
curl https://yourapp.com/api/health/email
```

### Responses

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

---

## 🔔 Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| API Response Time | >2s | >5s |
| Database Query | >1s | >3s |
| Error Rate | >10/min | >50/min |
| Uptime | <99.5% | <99% |
| Memory Usage | >80% | >90% |

---

## ⚙️ Environment Variables

```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx

# UptimeRobot (optional)
UPTIMEROBOT_API_KEY=your_api_key
```

---

## 📦 NPM Scripts

```bash
# Install monitoring deps
npm install @sentry/nextjs @vercel/analytics @vercel/speed-insights uuid

# Build with source maps (for Sentry)
npm run build
```

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] Set `NEXT_PUBLIC_SENTRY_DSN` in environment
- [ ] Add error boundaries to main app and pages
- [ ] Add Analytics and SpeedInsights to layout
- [ ] Create health check endpoints
- [ ] Set up UptimeRobot monitors
- [ ] Configure Slack alerts
- [ ] Test error reporting (trigger test error)
- [ ] Test performance tracking
- [ ] Create business metrics table
- [ ] Set up log aggregation (if using external service)
- [ ] Document incident response procedures
- [ ] Train team on monitoring tools

---

## 🔗 Quick Links

- [Sentry Dashboard](https://sentry.io)
- [Vercel Analytics](https://vercel.com/analytics)
- [UptimeRobot Dashboard](https://uptimerobot.com/dashboard)
- [Full Monitoring Guide](PRODUCTION_MONITORING_GUIDE.md)
- [Uptime Setup Guide](UPTIME_MONITORING_SETUP.md)

---

## 🆘 Troubleshooting

### Sentry Not Receiving Errors

1. Check `NEXT_PUBLIC_SENTRY_DSN` is set
2. Verify Sentry configs are loaded
3. Check error filters in `sentry.client.config.ts`
4. Test with `throw new Error('Test Sentry')` in component

### Performance Metrics Not Showing

1. Verify `trackMetric()` is being called
2. Check Sentry Performance tab (may take a few minutes)
3. Ensure `tracesSampleRate` > 0 in production

### Health Check Failing

1. Check database connection (Supabase URL correct?)
2. Verify AWS credentials for email check
3. Check server logs for errors
4. Test manually: `curl https://yourapp.com/api/health`

### Logs Not Appearing

1. Check console in development
2. Verify Vercel logs in production
3. Ensure `logger.info()` is being called
4. Check log level filters

---

For complete documentation, see [PRODUCTION_MONITORING_GUIDE.md](PRODUCTION_MONITORING_GUIDE.md)
