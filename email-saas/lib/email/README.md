# Email Sending System

Complete AWS SES-based bulk email sending system with tracking, queuing, and automated bounce/complaint handling.

## 📦 Components

### 1. SES Service (`ses-service.ts`)

Core email sending service using AWS SES.

**Features:**
- Batch sending (500 emails per batch)
- Rate limiting (14 emails/second default)
- Personalization with merge tags
- Automatic tracking pixel insertion
- Link wrapping for click tracking
- Unsubscribe footer
- Error handling and retry logic

**Usage:**

```typescript
import { createSESService } from '@/lib/email/ses-service';

const sesService = createSESService();

const result = await sesService.sendCampaign({
  campaignId: 'campaign-123',
  subject: 'Welcome to our newsletter',
  htmlContent: '<h1>Hi {{firstName}}!</h1>',
  recipients: [
    {
      id: 'contact-1',
      email: 'user@example.com',
      firstName: 'John',
      customFields: { city: 'New York' }
    }
  ],
  baseUrl: 'https://yourdomain.com'
});

console.log(`Sent: ${result.successful}, Failed: ${result.failed}`);
```

### 2. Email Tracking (`tracking.ts`)

Utilities for tracking email opens and clicks.

**Features:**
- 1x1 transparent tracking pixel
- Automatic link wrapping
- Merge tag replacement
- Unsubscribe link generation
- Custom field support

**Merge Tags:**

Available in email content:
- `{{email}}` - Contact email
- `{{firstName}}` - First name
- `{{lastName}}` - Last name
- `{{company}}` - Company name
- `{{fullName}}` - Full name (first + last)
- `{{customFieldName}}` - Any custom field

**Usage:**

```typescript
import {
  prepareTrackedEmail,
  replaceMergeTags,
  generateUnsubscribeLink
} from '@/lib/email/tracking';

// Prepare email with tracking
const trackedHtml = prepareTrackedEmail(
  htmlContent,
  campaignId,
  contactId,
  baseUrl
);

// Replace merge tags
const personalized = replaceMergeTags(content, {
  email: 'user@example.com',
  firstName: 'John',
  customFields: { role: 'Developer' }
});

// Generate unsubscribe link
const unsubUrl = generateUnsubscribeLink(contactId, campaignId, baseUrl);
```

## 🔄 Queue System

### 3. Redis Connection (`queue/redis.ts`)

Manages Redis connection for BullMQ.

**Configuration:**

```typescript
// Option 1: Redis URL
REDIS_URL=redis://user:password@host:6379

// Option 2: Individual settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional
REDIS_DB=0
```

### 4. Email Queue (`queue/email-queue.ts`)

BullMQ queue for managing email campaign jobs.

**Features:**
- Job priority
- Automatic retries (3 attempts)
- Exponential backoff
- Job cleanup
- Progress tracking
- Batch support

**Usage:**

```typescript
import {
  addCampaignToQueue,
  getQueueMetrics,
  getJobStatus
} from '@/lib/queue/email-queue';

// Add campaign to queue
const jobId = await addCampaignToQueue({
  campaignId: 'campaign-123',
  userId: 'user-123',
  subject: 'Newsletter',
  htmlContent: '<h1>Hello!</h1>',
  recipients: [...],
});

// Check status
const status = await getJobStatus(jobId);
console.log(status.progress); // { sent: 100, failed: 0, total: 250 }

// Get metrics
const metrics = await getQueueMetrics();
console.log(metrics); // { waiting: 5, active: 1, completed: 100 }
```

### 5. Email Worker (`queue/email-worker.ts`)

Background worker that processes email jobs.

**Features:**
- Concurrent processing with rate limiting
- Progress updates
- Database integration
- Event tracking
- Campaign status updates
- Error handling

**Running:**

```bash
# Development
npm run worker:dev

# Production
npm run worker

# With PM2
pm2 start npm --name "email-worker" -- run worker
```

## 🌐 API Endpoints

### 6. Open Tracking (`app/api/track/open/route.ts`)

Tracks email opens via 1x1 transparent GIF pixel.

**Endpoint:** `GET /api/track/open?c=CAMPAIGN_ID&ct=CONTACT_ID`

**Response:** 1x1 transparent GIF

**Database:** Creates `email_events` record with type `opened`

### 7. Click Tracking (`app/api/track/click/route.ts`)

Tracks link clicks and redirects to original URL.

**Endpoint:** `GET /api/track/click?c=CAMPAIGN_ID&ct=CONTACT_ID&url=ENCODED_URL`

**Response:** 302 redirect to original URL

**Database:** Creates `email_events` record with type `clicked`

### 8. SES Webhooks (`app/api/webhooks/ses/route.ts`)

Handles AWS SNS notifications for bounces, complaints, and delivery.

**Endpoint:** `POST /api/webhooks/ses`

**Handles:**
- **Bounces**: Updates contact status to `bounced`
- **Complaints**: Updates contact status to `complained`
- **Delivery**: Records successful delivery

**Setup:**

1. Create SNS topics in AWS
2. Subscribe this endpoint to topics
3. Configure SES to publish events to SNS

## 🎯 Campaign Service

### 9. Campaign Service (`services/campaign-service.ts`)

High-level service for orchestrating campaigns.

**Features:**
- Get recipients from lists
- Check email quotas
- Queue campaigns
- Schedule campaigns
- Send test emails
- Cancel campaigns
- Get campaign stats

**Usage:**

```typescript
import { CampaignService } from '@/lib/services/campaign-service';

// Send campaign
const result = await CampaignService.sendCampaign(
  'campaign-id',
  'user-id',
  {
    sendImmediately: true,
    batchSize: 500,
    priority: 1
  }
);

// Schedule for later
await CampaignService.scheduleCampaign(
  'campaign-id',
  'user-id',
  new Date('2024-12-25T10:00:00Z')
);

// Send test
await CampaignService.sendTestEmail(
  'campaign-id',
  'user-id',
  'test@example.com'
);

// Get stats
const stats = await CampaignService.getCampaignStats(
  'campaign-id',
  'user-id'
);
```

## 📊 Data Flow

### Campaign Send Flow

```
1. User creates campaign in dashboard
2. Campaign Service validates and prepares data
3. Job added to Redis queue via BullMQ
4. Worker picks up job from queue
5. SES Service sends emails in batches
6. Each email:
   - Personalized with merge tags
   - Tracking pixel inserted
   - Links wrapped for click tracking
   - Unsubscribe footer added
7. Email sent via AWS SES
8. Event recorded in database (type: sent)
9. Worker updates campaign stats
10. Campaign status updated to 'sent'
```

### Tracking Flow

**Opens:**
```
1. Email opened in inbox
2. Tracking pixel loads
3. GET /api/track/open?c=xxx&ct=yyy
4. Event saved to database (type: opened)
5. Contact.last_engaged_at updated
6. Campaign.emails_opened incremented
7. 1x1 GIF returned
```

**Clicks:**
```
1. User clicks link in email
2. Redirected to tracking URL
3. GET /api/track/click?c=xxx&ct=yyy&url=zzz
4. Event saved to database (type: clicked)
5. Contact.last_engaged_at updated
6. Campaign.emails_clicked incremented
7. User redirected to original URL
```

### Bounce/Complaint Flow

```
1. Email bounces or marked as spam
2. SES publishes event to SNS
3. SNS sends webhook to /api/webhooks/ses
4. Event saved to database
5. Contact status updated (bounced/complained)
6. Campaign stats updated
```

## 🔧 Configuration

### Environment Variables

```bash
# AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_SES_FROM_EMAIL=noreply@domain.com
AWS_SES_FROM_NAME=Company Name
AWS_SES_REPLY_TO_EMAIL=support@domain.com
AWS_SES_CONFIGURATION_SET=config-set-name
AWS_SES_SENDING_RATE=14
AWS_SES_BATCH_SIZE=500

# Redis
REDIS_URL=redis://...
# OR
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### SES Limits

Default limits (can be increased):
- **Sandbox**: 200 emails/day, verified recipients only
- **Production**: 50,000 emails/day, 14 emails/second
- **Maximum message size**: 10 MB

### Rate Limiting

Adjust based on your SES quota:

```bash
# Conservative (for new accounts)
AWS_SES_SENDING_RATE=5

# Default (standard production)
AWS_SES_SENDING_RATE=14

# High volume (increased quota)
AWS_SES_SENDING_RATE=50
```

## 📈 Performance

### Sending Speed

- **Single email**: ~100ms
- **1,000 emails**: ~72 seconds (at 14/sec)
- **10,000 emails**: ~12 minutes (at 14/sec)
- **100,000 emails**: ~2 hours (at 14/sec)

### Batch Processing

- **Batch size**: 500 emails (configurable)
- **Memory usage**: ~50MB per batch
- **Concurrent batches**: 1 (to respect rate limits)

### Database Impact

- **Email events**: 1 row per email sent
- **Campaign updates**: Triggered by database functions
- **Indexes**: Optimized for campaign/contact queries

## 🛡️ Error Handling

### Retry Strategy

```typescript
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000  // 5s, 10s, 20s
  }
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `MessageRejected` | Invalid recipient | Validate email format |
| `Throttling` | Rate limit exceeded | Reduce `AWS_SES_SENDING_RATE` |
| `ConfigurationSetDoesNotExist` | Missing config set | Create in AWS SES |
| `AccountSendingPausedException` | SES account suspended | Check AWS SES dashboard |

## 🧪 Testing

### Local Testing

1. **Without SES**: Use mock service
2. **With SES Sandbox**: Verify test emails first
3. **With SES Production**: Start with small batches

### Test Campaign

```typescript
const testRecipients = [
  {
    id: 'test-1',
    email: 'your-email@example.com',
    firstName: 'Test',
    lastName: 'User'
  }
];

await addCampaignToQueue({
  campaignId: 'test-campaign',
  userId: 'test-user',
  subject: 'Test Email',
  htmlContent: '<h1>Hello {{firstName}}!</h1>',
  recipients: testRecipients
});
```

## 📚 Additional Resources

- [AWS SES Best Practices](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/best-practices.html)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Email Deliverability Guide](https://aws.amazon.com/ses/email-deliverability/)

## 🆘 Troubleshooting

See [EMAIL_SENDING_SETUP.md](../../EMAIL_SENDING_SETUP.md) for detailed troubleshooting guide.
