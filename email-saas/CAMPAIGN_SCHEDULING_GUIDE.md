# Campaign Scheduling System Guide

Complete guide for scheduling email campaigns with timezone support, automatic triggering, and status management.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup](#setup)
4. [Usage](#usage)
5. [API Reference](#api-reference)
6. [Components](#components)
7. [Timezone Handling](#timezone-handling)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Campaign Scheduling System allows you to:

- ✅ Schedule campaigns for future sending
- ✅ Handle timezone conversions (15+ timezones supported)
- ✅ Automatically trigger campaigns when due (cron job runs every minute)
- ✅ Cancel or reschedule campaigns before sending
- ✅ Track campaign status (draft → scheduled → sending → sent)
- ✅ View relative time ("In 2 hours", "Tomorrow at 3pm")
- ✅ Integration with existing email queue system (BullMQ)

---

## Architecture

### System Components

```
┌─────────────────────┐
│   User Interface    │
│  (Schedule Form)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   API Routes        │
│  /api/campaigns/    │
│   [id]/schedule     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Campaign Scheduler │
│     Service         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐       ┌──────────────┐
│   Supabase DB       │◄──────┤  Cron Job    │
│  (campaigns table)  │       │ (Every min)  │
└─────────────────────┘       └──────────────┘
           │
           ▼
┌─────────────────────┐
│   BullMQ Queue      │
│  (Email Sending)    │
└─────────────────────┘
```

### Database Schema

The `campaigns` table needs these fields:

```sql
-- Status field
status VARCHAR -- 'draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'

-- Scheduling fields
scheduled_at TIMESTAMP WITH TIME ZONE -- UTC timestamp for sending
timezone VARCHAR -- User's timezone (e.g., 'America/New_York')
sent_at TIMESTAMP WITH TIME ZONE -- When campaign was actually sent

-- Existing fields
id UUID
user_id UUID
subject VARCHAR
html_content TEXT
list_id UUID
...
```

### Flow Diagram

```
1. User schedules campaign → Convert local time to UTC → Save to DB
                                                            ↓
2. Cron job (every minute) → Check for campaigns due → Status: scheduled && scheduled_at <= now
                                                            ↓
3. Found due campaign → Update status to 'sending' → Add to BullMQ queue
                                                            ↓
4. Worker processes queue → Send emails → Update status to 'sent'
```

---

## Setup

### 1. Database Migration

Add scheduling fields to your `campaigns` table:

```sql
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50),
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled
ON campaigns(status, scheduled_at)
WHERE deleted_at IS NULL;
```

### 2. Environment Variables

No additional environment variables needed! Uses existing:

```bash
# Existing Supabase config
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Existing Redis config (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# Existing AWS SES config
AWS_SES_FROM_EMAIL=...
```

### 3. Install Dependencies

Already included in package.json:

```bash
npm install
# Includes: node-cron, date-fns, date-fns-tz
```

---

## Usage

### Running the Scheduler

The scheduler is a separate process that runs alongside your Next.js app and worker.

**Development:**
```bash
# Terminal 1: Next.js app
npm run dev

# Terminal 2: Email worker
npm run worker:dev

# Terminal 3: Scheduler (NEW)
npm run scheduler
```

**Production:**
```bash
# Build first
npm run build

# Then run all three processes (use PM2 or supervisor)
npm start                    # Next.js
npm run worker              # Email worker
npm run scheduler:prod      # Scheduler
```

### Scheduling a Campaign

#### Via UI Component

```tsx
import { CampaignScheduler } from '@/components/campaigns/campaign-scheduler';

export default function CampaignPage({ campaignId, campaign }) {
  return (
    <div>
      <CampaignScheduler
        campaignId={campaignId}
        currentStatus={campaign.status}
        currentScheduledAt={campaign.scheduled_at}
        currentTimezone={campaign.timezone}
        onScheduled={() => {
          // Refresh campaign data
          console.log('Campaign scheduled!');
        }}
        onCancelled={() => {
          // Handle cancellation
          console.log('Campaign cancelled!');
        }}
      />
    </div>
  );
}
```

#### Via API

```typescript
// Schedule a campaign
const response = await fetch(`/api/campaigns/${campaignId}/schedule`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    scheduledTime: '2025-12-25T10:00:00', // Local time
    timezone: 'America/New_York',
  }),
});

const result = await response.json();
// { success: true, scheduledAt: '2025-12-25T15:00:00.000Z', timezone: 'America/New_York' }
```

### Cancelling a Scheduled Campaign

```typescript
const response = await fetch(`/api/campaigns/${campaignId}/schedule`, {
  method: 'DELETE',
});

const result = await response.json();
// { success: true, message: 'Campaign cancelled successfully' }
```

### Rescheduling a Campaign

```typescript
const response = await fetch(`/api/campaigns/${campaignId}/schedule`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    scheduledTime: '2025-12-26T14:00:00',
    timezone: 'America/Los_Angeles',
  }),
});
```

---

## API Reference

### POST /api/campaigns/[id]/schedule

Schedule a campaign for future sending.

**Request:**
```json
{
  "scheduledTime": "2025-12-25T10:00:00", // ISO 8601 format, local time
  "timezone": "America/New_York"           // IANA timezone
}
```

**Response:**
```json
{
  "success": true,
  "scheduledAt": "2025-12-25T15:00:00.000Z", // UTC
  "timezone": "America/New_York"
}
```

**Validation:**
- `scheduledTime` must be at least 5 minutes in the future
- `timezone` must be a valid IANA timezone
- Campaign must belong to authenticated user
- Campaign must not be sent or sending

---

### GET /api/campaigns/[id]/schedule

Get campaign schedule information.

**Response:**
```json
{
  "status": "scheduled",
  "scheduledAt": "2025-12-25T15:00:00.000Z",
  "timezone": "America/New_York",
  "sentAt": null
}
```

---

### DELETE /api/campaigns/[id]/schedule

Cancel a scheduled campaign.

**Response:**
```json
{
  "success": true,
  "message": "Campaign cancelled successfully"
}
```

**Validation:**
- Campaign must have status 'scheduled'
- Campaign must belong to authenticated user

---

### PATCH /api/campaigns/[id]/schedule

Reschedule a campaign to a new time.

**Request:**
```json
{
  "scheduledTime": "2025-12-26T14:00:00",
  "timezone": "America/Los_Angeles"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Campaign rescheduled successfully"
}
```

---

## Components

### CampaignScheduler

Main scheduling component with full UI for schedule/cancel/reschedule.

**Props:**

```typescript
interface CampaignSchedulerProps {
  campaignId: string;
  currentStatus?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  currentScheduledAt?: string | null;
  currentTimezone?: string | null;
  onScheduled?: () => void;
  onCancelled?: () => void;
}
```

**Features:**
- Timezone selector (15 timezones)
- Date/time picker with min validation (5 min from now)
- Auto-detects browser timezone
- Schedule/reschedule/cancel actions
- Real-time validation and error handling
- Success/error notifications

---

### CampaignStatusBadge

Visual status indicator with icons and relative time.

**Props:**

```typescript
interface CampaignStatusBadgeProps {
  status: CampaignStatus;
  scheduledAt?: string | null;
  sentAt?: string | null;
  showTime?: boolean;
}
```

**Usage:**

```tsx
<CampaignStatusBadge
  status="scheduled"
  scheduledAt="2025-12-25T15:00:00.000Z"
  showTime={true}
/>
// Displays: "Scheduled" badge + "Sends in 2 days"
```

**Status Colors:**
- Draft: Gray
- Scheduled: Teal (with clock icon)
- Sending: Blue (with spinner)
- Sent: Green (with checkmark)
- Paused: Yellow
- Cancelled: Red

---

## Timezone Handling

### Supported Timezones

15 common timezones including:

- UTC
- Eastern Time (America/New_York)
- Central Time (America/Chicago)
- Mountain Time (America/Denver)
- Pacific Time (America/Los_Angeles)
- London (Europe/London)
- Paris (Europe/Paris)
- Tokyo (Asia/Tokyo)
- Sydney (Australia/Sydney)
- And more...

See [`lib/scheduler/timezone.ts`](lib/scheduler/timezone.ts#L7) for full list.

### Utility Functions

```typescript
import {
  toUTC,           // Convert local time to UTC
  fromUTC,         // Convert UTC to local time
  getRelativeTime, // "In 2 hours", "Tomorrow"
  formatInUserTimezone, // Format date in user's TZ
  getBrowserTimezone,   // Auto-detect browser TZ
} from '@/lib/scheduler/timezone';

// Convert user's local time to UTC for storage
const utcDate = toUTC('2025-12-25T10:00:00', 'America/New_York');
// Result: 2025-12-25T15:00:00.000Z

// Convert UTC to user's local time for display
const localDate = fromUTC('2025-12-25T15:00:00.000Z', 'America/New_York');
// Result: 2025-12-25T10:00:00

// Get relative time string
const relative = getRelativeTime('2025-12-25T15:00:00.000Z');
// Result: "In 2 days" or "In 3 hours"
```

### Best Practices

1. **Always store in UTC**: Database `scheduled_at` field is UTC
2. **Convert for display**: Show times in user's timezone
3. **Include timezone**: Store user's timezone for accurate conversion
4. **Validate**: Check scheduled time is not in the past

---

## Deployment

### Using PM2 (Recommended)

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'email-saas-app',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'email-worker',
      script: 'npm',
      args: 'run worker',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'campaign-scheduler',
      script: 'npm',
      args: 'run scheduler:prod',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

Then run:

```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Using Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    command: npm start
    ports:
      - '3000:3000'
    env_file: .env

  worker:
    build: .
    command: npm run worker
    env_file: .env

  scheduler:
    build: .
    command: npm run scheduler:prod
    env_file: .env

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
```

### Vercel Deployment

**Important:** Vercel doesn't support long-running cron jobs. Options:

1. **Use Vercel Cron (Recommended)**:
   - Create `vercel.json`:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/scheduler",
         "schedule": "* * * * *"
       }
     ]
   }
   ```
   - Create API route at `app/api/cron/scheduler/route.ts`:
   ```typescript
   import { CampaignScheduler } from '@/lib/scheduler/campaign-scheduler';

   export async function GET() {
     const results = await CampaignScheduler.processDueCampaigns();
     return Response.json(results);
   }
   ```

2. **External Cron Service**:
   - Deploy scheduler to separate server (Railway, Render, etc.)
   - Run as background worker

---

## Troubleshooting

### Campaigns Not Sending

**Check:**
1. Is scheduler running? `ps aux | grep scheduler`
2. Check logs: `pm2 logs campaign-scheduler`
3. Verify cron is running: Should log every minute
4. Check database: `SELECT * FROM campaigns WHERE status = 'scheduled' AND scheduled_at <= NOW()`

**Common Issues:**
- Scheduler not started: `npm run scheduler`
- Wrong timezone: Verify `scheduled_at` is correct UTC time
- Campaign missing required fields: `html_content`, `list_id`, `subject`

---

### Timezone Issues

**Issue:** Campaign sends at wrong time

**Solution:**
1. Verify timezone is correct in database
2. Check `scheduled_at` is in UTC
3. Use timezone utilities for conversion:
   ```typescript
   const utc = toUTC(userTime, userTimezone);
   ```

**Debug:**
```typescript
console.log('User time:', '2025-12-25T10:00:00');
console.log('Timezone:', 'America/New_York');
console.log('UTC:', toUTC('2025-12-25T10:00:00', 'America/New_York'));
// Should be: 2025-12-25T15:00:00.000Z (EST is UTC-5)
```

---

### Scheduler Crashes

**Check logs:**
```bash
pm2 logs campaign-scheduler --lines 100
```

**Common causes:**
- Database connection issues
- Redis connection issues (BullMQ dependency)
- Permissions: Ensure scheduler can access Supabase

**Restart:**
```bash
pm2 restart campaign-scheduler
```

---

### Campaign Stuck in "Sending"

**Cause:** Worker crashed or failed to update status

**Fix:**
1. Check worker logs: `pm2 logs email-worker`
2. Check BullMQ queue: Use Bull Board or Redis CLI
3. Manually update status if needed:
   ```sql
   UPDATE campaigns
   SET status = 'sent', sent_at = NOW()
   WHERE id = 'campaign-id' AND status = 'sending';
   ```

---

## Advanced Configuration

### Custom Cron Schedule

Edit [`lib/scheduler/cron.ts`](lib/scheduler/cron.ts#L12):

```typescript
// Every minute (default)
cron.schedule('* * * * *', ...)

// Every 5 minutes
cron.schedule('*/5 * * * *', ...)

// Every hour
cron.schedule('0 * * * *', ...)
```

### Rate Limiting

Campaigns automatically use BullMQ queue with existing rate limits (14 emails/sec by default).

To change, edit [`lib/queue/email-queue.ts`](lib/queue/email-queue.ts) and [`lib/email/ses-service.ts`](lib/email/ses-service.ts).

---

## Monitoring

### Check Scheduled Campaigns

```sql
SELECT
  id,
  subject,
  status,
  scheduled_at AT TIME ZONE 'UTC' AS scheduled_utc,
  timezone,
  created_at
FROM campaigns
WHERE status = 'scheduled'
ORDER BY scheduled_at ASC;
```

### View Processing Stats

```bash
# Scheduler logs show results
pm2 logs campaign-scheduler

# Example output:
# [2025-12-14T10:00:00.000Z] Running scheduled campaign check...
# ✓ Triggered campaign abc-123, job ID: job-456
# Results:
#   - Processed: 1
#   - Succeeded: 1
#   - Failed: 0
```

---

## File Reference

### Core Files

- [`lib/scheduler/timezone.ts`](lib/scheduler/timezone.ts) - Timezone utilities
- [`lib/scheduler/campaign-scheduler.ts`](lib/scheduler/campaign-scheduler.ts) - Scheduler service
- [`lib/scheduler/cron.ts`](lib/scheduler/cron.ts) - Cron job
- [`app/api/campaigns/[id]/schedule/route.ts`](app/api/campaigns/[id]/schedule/route.ts) - API endpoints

### Components

- [`components/campaigns/campaign-scheduler.tsx`](components/campaigns/campaign-scheduler.tsx) - Scheduling UI
- [`components/campaigns/campaign-status-badge.tsx`](components/campaigns/campaign-status-badge.tsx) - Status badge

---

## Support

For issues or questions:
1. Check logs: `pm2 logs`
2. Verify database schema matches guide
3. Ensure all 3 processes are running (app, worker, scheduler)
4. Check timezone conversion with utility functions

---

**Happy Scheduling! 🚀**
