# AWS SES Email Sending System - Setup Guide

Complete guide for setting up and using the bulk email sending system with AWS SES, BullMQ, and Redis.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Environment Variables](#environment-variables)
5. [AWS SES Setup](#aws-ses-setup)
6. [Redis Setup](#redis-setup)
7. [Running the Worker](#running-the-worker)
8. [Usage Examples](#usage-examples)
9. [Monitoring](#monitoring)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This email sending system provides:

- ✅ **Bulk email sending** through AWS SES
- ✅ **Rate limiting** to respect SES quotas (14 emails/second default)
- ✅ **Batch processing** (500 emails per batch)
- ✅ **Queue system** with BullMQ and Redis
- ✅ **Email tracking** (opens and clicks)
- ✅ **Bounce and complaint handling**
- ✅ **Merge tags** for personalization
- ✅ **Automatic unsubscribe links**
- ✅ **Retry logic** for failed sends

---

## Architecture

```
┌─────────────────┐
│   Next.js App   │
│  (Campaign UI)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│  Campaign Service   │
│  (Queue Jobs)       │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐      ┌──────────────┐
│   Redis Queue       │◄────►│  BullMQ      │
│   (Job Storage)     │      │  Worker      │
└─────────────────────┘      └──────┬───────┘
                                    │
                                    ▼
                             ┌──────────────┐
                             │  SES Service │
                             │  (Send Emails)│
                             └──────┬───────┘
                                    │
                                    ▼
                             ┌──────────────┐
                             │   AWS SES    │
                             └──────┬───────┘
                                    │
         ┌──────────────────────────┴─────────────────┐
         │                                            │
         ▼                                            ▼
┌─────────────────┐                          ┌──────────────┐
│  Email Events   │                          │  Webhooks    │
│  (Opens/Clicks) │                          │ (Bounces/    │
│                 │                          │  Complaints) │
└─────────────────┘                          └──────────────┘
```

---

## Prerequisites

### Required Services

1. **AWS Account** with SES access
2. **Redis Server** (local or cloud)
3. **PostgreSQL Database** (for campaign data)
4. **Node.js 18+**

### AWS SES Requirements

- **Production Access**: Request production access to send to any email (sandbox allows only verified emails)
- **Domain Verification**: Verify your sending domain
- **Email Verification**: Verify sender email addresses
- **SNS Topic**: Set up for bounce/complaint notifications

---

## Environment Variables

Add these to your `.env.local` file:

```bash
# ============================================
# AWS SES Configuration
# ============================================

# AWS Credentials (IAM user with SES permissions)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# SES Sending Configuration
AWS_SES_FROM_EMAIL=noreply@yourdomain.com
AWS_SES_FROM_NAME=Your Company Name
AWS_SES_REPLY_TO_EMAIL=support@yourdomain.com

# SES Configuration Set (for tracking bounces/complaints)
AWS_SES_CONFIGURATION_SET=email-marketing-config-set

# Rate Limiting
AWS_SES_SENDING_RATE=14          # Emails per second (adjust based on SES quota)
AWS_SES_BATCH_SIZE=500           # Emails per batch

# ============================================
# Redis Configuration
# ============================================

# Option 1: Redis URL (for cloud Redis like Upstash, Redis Cloud)
REDIS_URL=redis://default:password@your-redis-host:6379

# Option 2: Individual Redis settings (for local Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ============================================
# Application URLs
# ============================================

# Base URL for tracking links
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# ============================================
# Supabase (already configured)
# ============================================

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## AWS SES Setup

### 1. Create IAM User for SES

Create an IAM user with the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail",
        "ses:SendTemplatedEmail",
        "ses:GetSendQuota",
        "ses:GetSendStatistics"
      ],
      "Resource": "*"
    }
  ]
}
```

### 2. Verify Domain or Email

**Option A: Verify Domain (Recommended)**

1. Go to AWS SES Console → Verified identities
2. Click "Create identity"
3. Select "Domain"
4. Enter your domain (e.g., `yourdomain.com`)
5. Add the provided DNS records (DKIM, SPF, DMARC)

**Option B: Verify Email Address**

1. Go to AWS SES Console → Verified identities
2. Click "Create identity"
3. Select "Email address"
4. Enter your email
5. Check inbox for verification email

### 3. Request Production Access

1. Go to AWS SES Console
2. Click "Get started" under "Move out of sandbox"
3. Fill out the request form:
   - Use case: Marketing emails
   - Expected sending volume
   - Bounce/complaint handling process
4. Wait for approval (usually 24 hours)

### 4. Set Up Configuration Set (for Bounces/Complaints)

```bash
# Create configuration set
aws sesv2 create-configuration-set \
  --configuration-set-name email-marketing-config-set

# Create SNS topic for bounces
aws sns create-topic --name ses-bounces

# Create SNS topic for complaints
aws sns create-topic --name ses-complaints

# Subscribe webhook endpoint to SNS topics
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:ses-bounces \
  --protocol https \
  --notification-endpoint https://yourdomain.com/api/webhooks/ses

aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:ses-complaints \
  --protocol https \
  --notification-endpoint https://yourdomain.com/api/webhooks/ses
```

### 5. Set Up Event Destinations

In AWS SES Console:

1. Go to Configuration Sets → `email-marketing-config-set`
2. Add Event Destination for "Bounce"
   - Select SNS topic: `ses-bounces`
3. Add Event Destination for "Complaint"
   - Select SNS topic: `ses-complaints`
4. Add Event Destination for "Delivery" (optional)

---

## Redis Setup

### Option 1: Local Redis (Development)

```bash
# Install Redis
# macOS
brew install redis

# Ubuntu
sudo apt-get install redis-server

# Windows (use WSL or Docker)
docker run -d -p 6379:6379 redis:alpine

# Start Redis
redis-server

# Test connection
redis-cli ping
# Should return: PONG
```

### Option 2: Cloud Redis (Production)

**Upstash Redis (Recommended - Free Tier Available)**

1. Sign up at [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy the `REDIS_URL`
4. Add to `.env.local`

**Other Options:**

- Redis Cloud
- AWS ElastiCache
- DigitalOcean Managed Redis

---

## Running the Worker

The worker is a separate process that processes email jobs from the queue.

### Development

```bash
# Run worker in development mode
npm run worker:dev

# Or use ts-node directly
npx ts-node --project tsconfig.json lib/queue/email-worker.ts
```

### Production

Add to `package.json`:

```json
{
  "scripts": {
    "worker": "node dist/lib/queue/email-worker.js",
    "worker:dev": "tsx lib/queue/email-worker.ts"
  }
}
```

Then run:

```bash
# Build first
npm run build

# Start worker
npm run worker
```

### Using Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start worker
pm2 start npm --name "email-worker" -- run worker

# Monitor
pm2 monit

# View logs
pm2 logs email-worker

# Restart
pm2 restart email-worker

# Stop
pm2 stop email-worker
```

### Docker Deployment

Create `Dockerfile.worker`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

CMD ["npm", "run", "worker"]
```

Build and run:

```bash
docker build -f Dockerfile.worker -t email-worker .
docker run -d --env-file .env.local email-worker
```

---

## Usage Examples

### 1. Send Campaign (from API route or server action)

```typescript
import { CampaignService } from '@/lib/services/campaign-service';

// Send campaign immediately
const result = await CampaignService.sendCampaign(
  'campaign-uuid',
  'user-uuid',
  {
    sendImmediately: true,
    batchSize: 500,
    priority: 1,
  }
);

console.log(`Sent to ${result.totalRecipients} recipients in ${result.totalBatches} batches`);
```

### 2. Schedule Campaign

```typescript
// Schedule for 2 hours from now
const scheduledTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

const result = await CampaignService.scheduleCampaign(
  'campaign-uuid',
  'user-uuid',
  scheduledTime
);
```

### 3. Send Test Email

```typescript
const result = await CampaignService.sendTestEmail(
  'campaign-uuid',
  'user-uuid',
  'test@example.com'
);
```

### 4. Check Queue Status

```typescript
import { getQueueMetrics, getJobStatus } from '@/lib/queue/email-queue';

// Get overall queue metrics
const metrics = await getQueueMetrics();
console.log(`Active jobs: ${metrics.active}`);
console.log(`Waiting jobs: ${metrics.waiting}`);
console.log(`Failed jobs: ${metrics.failed}`);

// Get specific job status
const status = await getJobStatus('job-id');
console.log(`State: ${status.state}`);
console.log(`Progress: ${status.progress?.sent}/${status.progress?.total}`);
```

### 5. Cancel Campaign

```typescript
const result = await CampaignService.cancelCampaign(
  'campaign-uuid',
  'user-uuid'
);
```

---

## Monitoring

### Queue Dashboard (BullMQ Board)

Install BullMQ Board for visual monitoring:

```bash
npm install @bull-board/express @bull-board/api
```

Create `app/api/admin/queues/route.ts`:

```typescript
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getEmailQueue } from '@/lib/queue/email-queue';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/api/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(getEmailQueue())],
  serverAdapter,
});

export const GET = serverAdapter.registerPlugin();
```

Access at: `http://localhost:3000/api/admin/queues`

### Logs

Monitor worker logs:

```bash
# PM2
pm2 logs email-worker --lines 100

# Docker
docker logs -f email-worker
```

### Database Queries

```sql
-- Campaign stats
SELECT
  id,
  name,
  status,
  emails_sent,
  emails_delivered,
  open_rate,
  click_rate
FROM campaigns
WHERE status = 'sent'
ORDER BY sent_at DESC
LIMIT 10;

-- Recent email events
SELECT
  event_type,
  COUNT(*) as count
FROM email_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type;

-- Bounce rate
SELECT
  COUNT(*) FILTER (WHERE event_type = 'bounced') as bounces,
  COUNT(*) FILTER (WHERE event_type = 'sent') as sent,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'bounced')::DECIMAL /
    COUNT(*) FILTER (WHERE event_type = 'sent') * 100,
    2
  ) as bounce_rate
FROM email_events
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## Troubleshooting

### Issue: Worker not processing jobs

**Solution:**

1. Check Redis connection:
   ```bash
   redis-cli ping
   ```

2. Verify worker is running:
   ```bash
   pm2 list
   ```

3. Check worker logs for errors:
   ```bash
   pm2 logs email-worker
   ```

### Issue: SES "Email address not verified"

**Solution:**

You're in SES sandbox mode. Either:

1. Request production access
2. Verify recipient email addresses for testing

### Issue: Rate limit exceeded

**Solution:**

1. Check your SES sending quota:
   ```bash
   aws sesv2 get-account
   ```

2. Adjust `AWS_SES_SENDING_RATE` in `.env.local`

### Issue: Emails going to spam

**Solution:**

1. Set up SPF record:
   ```
   v=spf1 include:amazonses.com ~all
   ```

2. Set up DKIM (done during domain verification)

3. Set up DMARC:
   ```
   v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
   ```

4. Warm up your domain (start with small volumes, increase gradually)

### Issue: High bounce rate

**Solution:**

1. Clean your contact list
2. Use double opt-in
3. Remove bounced emails automatically
4. Check email content (avoid spam triggers)

### Issue: Jobs stuck in "active" state

**Solution:**

```bash
# Clean stuck jobs (development only)
redis-cli FLUSHALL

# Or use BullMQ API
import { getEmailQueue } from '@/lib/queue/email-queue';

const queue = getEmailQueue();
await queue.clean(0, 1000, 'active');
```

---

## Best Practices

1. **Start Small**: Test with small campaigns before sending to large lists
2. **Monitor Metrics**: Keep bounce rate < 5%, complaint rate < 0.1%
3. **Gradual Warmup**: Increase sending volume gradually over 2-4 weeks
4. **List Hygiene**: Remove bounced/complained contacts immediately
5. **Double Opt-in**: Confirm subscriptions to reduce spam complaints
6. **Unsubscribe Link**: Always include (handled automatically)
7. **Throttle Rate**: Respect SES limits to avoid throttling
8. **Test Emails**: Always send test before production
9. **Error Handling**: Monitor failed jobs and retry appropriately
10. **Backup**: Keep backups of campaign data and contacts

---

## Additional Resources

- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Email Deliverability Best Practices](https://aws.amazon.com/ses/email-best-practices/)
- [DMARC Guide](https://dmarc.org/)

---

## Support

For issues or questions:

1. Check the logs first
2. Review AWS SES dashboard
3. Monitor Redis queue
4. Check database for errors
