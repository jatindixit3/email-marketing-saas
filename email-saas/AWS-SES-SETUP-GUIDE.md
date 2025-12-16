# AWS SES Setup Guide for SendBear

## Current Status

Your SendBear application is configured to use AWS SES for sending emails. Here's what you need to do to get it working:

## Step 1: Check Your .env File

Make sure your `.env` file (NOT `.env.example`) has these values filled in:

```env
# AWS SES Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_actual_aws_access_key
AWS_SECRET_ACCESS_KEY=your_actual_aws_secret_key
AWS_SES_FROM_EMAIL=noreply@sendbear.co
AWS_SES_FROM_NAME=SendBear
AWS_SES_REPLY_TO_EMAIL=support@sendbear.co
```

## Step 2: Set Up AWS SES

### 2.1 Create AWS Account
1. Go to https://aws.amazon.com/
2. Create an account or sign in

### 2.2 Verify Your Email/Domain

**Option A: Verify Single Email (Quick Start)**
1. Go to AWS SES Console: https://console.aws.amazon.com/ses/
2. Click "Verified identities" → "Create identity"
3. Choose "Email address"
4. Enter: `noreply@sendbear.co` or your email
5. Click "Create identity"
6. **Check your email** for verification link
7. Click the link to verify

**Option B: Verify Domain (Recommended for Production)**
1. Go to AWS SES Console
2. Click "Verified identities" → "Create identity"
3. Choose "Domain"
4. Enter: `sendbear.co`
5. AWS will give you DNS records
6. Add these to your domain registrar (GoDaddy, Namecheap, etc.)
7. Wait for verification (can take up to 72 hours)

### 2.3 Request Production Access

By default, AWS SES is in **SANDBOX mode** - you can only send to verified emails.

To send to ANY email address:
1. Go to SES Console
2. Click "Account dashboard"
3. Find "Sending statistics" box
4. Click "Request production access"
5. Fill out the form:
   - **Mail Type**: Transactional
   - **Website URL**: https://sendbear.co
   - **Use case**: Email marketing platform for small businesses
   - **Describe how you handle bounces**: We use AWS SES bounce notifications
   - **Describe compliance**: Users must opt-in, we provide unsubscribe links
6. Submit request (usually approved within 24 hours)

### 2.4 Create IAM User (Security Best Practice)

Instead of using your root AWS credentials:

1. Go to IAM Console: https://console.aws.amazon.com/iam/
2. Click "Users" → "Create user"
3. Username: `sendbear-ses-user`
4. Click "Next"
5. **Attach permissions**:
   - Click "Attach policies directly"
   - Search for `AmazonSESFullAccess`
   - Check the box
   - Click "Next" → "Create user"
6. **Create Access Keys**:
   - Click on the user you just created
   - Go to "Security credentials" tab
   - Click "Create access key"
   - Choose "Application running outside AWS"
   - Click "Next" → "Create access key"
   - **COPY THESE** (you won't see them again):
     - Access key ID
     - Secret access key

7. **Add to your .env file**:
```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE  # Your actual key
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY  # Your actual secret
```

## Step 3: Test Email Sending

### 3.1 Check if SES is Connected

Create a test file to verify SES works:

```typescript
// test-ses.ts
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function testSES() {
  try {
    const result = await ses.send(new SendEmailCommand({
      Source: process.env.AWS_SES_FROM_EMAIL,
      Destination: {
        ToAddresses: ['your-test-email@example.com'], // Change this!
      },
      Message: {
        Subject: { Data: 'Test from SendBear' },
        Body: {
          Text: { Data: 'This is a test email from SendBear!' },
        },
      },
    }));

    console.log('✅ Email sent successfully!', result.MessageId);
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
}

testSES();
```

Run it: `npx tsx test-ses.ts`

## Common Issues & Solutions

### Issue 1: "Email address is not verified"
**Solution**: You're in sandbox mode. Either:
- Add the recipient email to verified identities
- Request production access (Step 2.3)

### Issue 2: "Invalid credentials"
**Solution**:
- Check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
- Make sure there are no extra spaces
- Verify the IAM user has SES permissions

### Issue 3: "Rate limit exceeded"
**Solution**:
- In sandbox: 1 email per second
- In production: Up to 14 emails per second (default)
- You can request higher limits in AWS Console

### Issue 4: Emails going to spam
**Solution**:
- Verify your domain (not just email)
- Set up SPF, DKIM, and DMARC records
- SendBear already includes these in the domain verification process

## Checking SendBear Email Status

Once SES is configured, you can check if emails are being sent:

1. **Dashboard**: Your imported contacts will show up after import
2. **AWS SES Console**: Go to "Sending statistics" to see email metrics
3. **Campaign Status**: When you create campaigns, you'll see send status

## Quick Checklist

- [ ] AWS account created
- [ ] Email address verified (at minimum)
- [ ] IAM user created with SES permissions
- [ ] Access keys copied to `.env` file
- [ ] Test email sent successfully
- [ ] (Optional) Production access requested
- [ ] (Recommended) Domain verified

## Need Help?

If emails still aren't sending:
1. Check AWS CloudWatch logs
2. Verify your `.env` file has correct values
3. Make sure you restarted the server after updating `.env`
4. Check SES quotas in AWS Console

## Current SendBear Integration

Your app already has:
✅ SES integration code (`lib/email/ses-service.ts`)
✅ Email queue system (`lib/queue/email-queue.ts`)
✅ Campaign sending logic
✅ Bounce/complaint handling

You just need to:
1. Configure AWS SES (this guide)
2. Add credentials to `.env`
3. Start sending!
