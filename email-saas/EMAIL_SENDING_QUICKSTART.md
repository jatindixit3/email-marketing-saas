# Email Sending System - Quick Start Guide

Get your bulk email sending system up and running in minutes.

## 🚀 Quick Setup (3 Steps)

### Step 1: Install Dependencies

Already done! You have:
- ✅ AWS SDK v3 (SES)
- ✅ BullMQ (Job Queue)
- ✅ ioredis (Redis Client)
- ✅ tsx (TypeScript Execution)

### Step 2: Configure Environment Variables

Update `.env.local` with your AWS and Redis credentials:

```bash
# AWS SES (Required)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SES_FROM_EMAIL=noreply@yourdomain.com

# Redis (Required - use local Redis for now)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Step 3: Start Services

```bash
# Terminal 1: Start Redis (if not running)
redis-server

# Terminal 2: Start Next.js dev server
npm run dev

# Terminal 3: Start email worker
npm run worker:dev
```

---

## 📧 Sending Your First Campaign

### Method 1: Using the Campaign Service

Create `app/api/campaigns/send/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { CampaignService } from '@/lib/services/campaign-service';

export async function POST(request: Request) {
  const { campaignId, userId } = await request.json();

  const result = await CampaignService.sendCampaign(campaignId, userId, {
    sendImmediately: true,
  });

  return NextResponse.json(result);
}
```

Then send via API:

```bash
curl -X POST http://localhost:3000/api/campaigns/send \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"your-campaign-id","userId":"your-user-id"}'
```

### Method 2: Direct Queue Usage

```typescript
import { addCampaignToQueue } from '@/lib/queue/email-queue';

await addCampaignToQueue({
  campaignId: 'campaign-123',
  userId: 'user-123',
  subject: 'Hello World!',
  htmlContent: '<h1>Test Email</h1><p>This is a test.</p>',
  recipients: [
    {
      id: 'contact-1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    },
  ],
});
```

---

## 📊 What Happens When You Send

```
1. Campaign queued → Redis
2. Worker picks up job
3. Emails sent via SES (14/second)
4. Tracking pixel added
5. Links wrapped for click tracking
6. Events saved to database
7. Campaign stats updated
```

---

## 🧪 Testing Without AWS SES

For local testing without AWS SES:

1. **Mock SES Service** - Create a test service:

```typescript
// lib/email/mock-ses-service.ts
export class MockSESService {
  async sendCampaign(request: any) {
    console.log('MOCK: Would send to:', request.recipients.length, 'recipients');

    return {
      total: request.recipients.length,
      successful: request.recipients.length,
      failed: 0,
      results: request.recipients.map((r: any) => ({
        recipientId: r.id,
        email: r.email,
        success: true,
        messageId: 'mock-' + Math.random(),
      })),
    };
  }
}
```

2. **Use in Worker** - Update `email-worker.ts`:

```typescript
// Development: Use mock service
const sesService = process.env.NODE_ENV === 'development'
  ? new MockSESService()
  : createSESService();
```

---

## 🔍 Monitoring

### Check Queue Status

```typescript
import { getQueueMetrics } from '@/lib/queue/email-queue';

const metrics = await getQueueMetrics();
console.log(metrics);
// { waiting: 0, active: 1, completed: 45, failed: 0, delayed: 0 }
```

### View Worker Logs

The worker outputs detailed logs:

```
Email worker started and listening for jobs...
Processing job 123: Campaign abc-def
Recipients: 250
Progress: 100/250 emails sent
Job 123 completed: 250/250 emails sent
```

### Database Queries

```sql
-- Recent campaigns
SELECT name, status, emails_sent, open_rate
FROM campaigns
ORDER BY created_at DESC
LIMIT 10;

-- Email events (last hour)
SELECT event_type, COUNT(*)
FROM email_events
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY event_type;
```

---

## 🎯 Key Features

### 1. Email Tracking

**Opens**: Automatic 1x1 pixel tracking
- Endpoint: `/api/track/open`
- Unique opens per contact

**Clicks**: All links automatically tracked
- Endpoint: `/api/track/click`
- Redirects to original URL
- Saves click event

### 2. Merge Tags

Use in your email content:

```html
<p>Hi {{firstName}},</p>
<p>Your email is {{email}}</p>
<p>Company: {{company}}</p>
```

Custom fields also work:
```html
<p>Your subscription expires on {{subscriptionEndDate}}</p>
```

### 3. Rate Limiting

- Default: 14 emails/second
- Configurable via `AWS_SES_SENDING_RATE`
- Respects SES quotas automatically

### 4. Batch Processing

- Default batch size: 500 emails
- Automatic splitting for large campaigns
- Progress tracking per batch

### 5. Error Handling

- 3 automatic retries for failed sends
- Exponential backoff (5s, 10s, 20s)
- Failed jobs kept for 7 days

---

## 🚨 Common Issues

### "Redis connection failed"

```bash
# Start Redis
redis-server

# Or install Redis:
# macOS: brew install redis
# Ubuntu: sudo apt-get install redis-server
# Windows: Use WSL or Docker
```

### "AWS credentials not found"

Update `.env.local` with valid AWS credentials:

```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### "Email address not verified" (SES Sandbox)

Option 1: Verify the test email in AWS SES Console

Option 2: Request production access (takes 24 hours)

### Worker not processing jobs

1. Check if worker is running: `ps aux | grep worker`
2. Check Redis: `redis-cli ping`
3. Check worker logs for errors

---

## 📁 File Structure

```
lib/
├── email/
│   ├── ses-service.ts        # AWS SES integration
│   └── tracking.ts            # Open/click tracking
├── queue/
│   ├── redis.ts               # Redis connection
│   ├── email-queue.ts         # BullMQ queue
│   └── email-worker.ts        # Job processor
└── services/
    └── campaign-service.ts    # Campaign orchestration

app/api/
├── track/
│   ├── open/route.ts          # Open tracking endpoint
│   └── click/route.ts         # Click tracking endpoint
└── webhooks/
    └── ses/route.ts           # Bounce/complaint handler
```

---

## 🎓 Learn More

- **Full Setup Guide**: See [EMAIL_SENDING_SETUP.md](./EMAIL_SENDING_SETUP.md)
- **AWS SES Docs**: https://docs.aws.amazon.com/ses/
- **BullMQ Docs**: https://docs.bullmq.io/

---

## 💡 Tips

1. **Start Small**: Test with 10-20 emails first
2. **Use Test Emails**: `CampaignService.sendTestEmail()`
3. **Monitor Logs**: Watch worker output for issues
4. **Check Metrics**: Use `getQueueMetrics()` regularly
5. **Clean Lists**: Remove bounced contacts automatically

---

## 🆘 Need Help?

1. Check worker logs
2. Verify Redis is running
3. Check AWS SES dashboard
4. Review database for errors
5. See full documentation in [EMAIL_SENDING_SETUP.md](./EMAIL_SENDING_SETUP.md)
