// Email Sending with Warmup Enforcement
// Integrates warmup limits into the email sending flow

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { canSendEmails, trackWarmupSend, createWarmupAlert } from '@/lib/services/warmup-service'
import { ApiError } from '@/lib/errors/api-error'
import { logger } from '@/lib/logging/logger'

const ses = new SESClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export interface SendEmailOptions {
  userId: string
  from: string
  to: string | string[]
  subject: string
  htmlBody: string
  textBody?: string
  campaignId?: string
  trackingEnabled?: boolean
}

export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
  blockedByWarmup?: boolean
  warmupInfo?: {
    limit: number
    current: number
    remaining: number
  }
}

/**
 * Send email with warmup enforcement
 */
export async function sendEmailWithWarmup(
  options: SendEmailOptions
): Promise<SendResult> {
  const { userId, from, to, subject, htmlBody, textBody } = options

  // Convert to array for consistency
  const recipients = Array.isArray(to) ? to : [to]
  const emailCount = recipients.length

  try {
    // Check warmup limits
    const warmupCheck = await canSendEmails(userId, emailCount)

    if (!warmupCheck.allowed) {
      logger.warn('Email blocked by warmup limits', {
        userId,
        emailCount,
        reason: warmupCheck.reason,
      })

      // Create alert for user
      await createWarmupAlert(
        userId,
        'limit_reached',
        'warning',
        'Daily Send Limit Reached',
        warmupCheck.reason || 'You have reached your daily send limit.',
        {
          limit: warmupCheck.limit,
          current: warmupCheck.current,
          attempted: emailCount,
        }
      )

      return {
        success: false,
        error: warmupCheck.reason,
        blockedByWarmup: true,
        warmupInfo: {
          limit: warmupCheck.limit!,
          current: warmupCheck.current!,
          remaining: warmupCheck.limit! - warmupCheck.current!,
        },
      }
    }

    // Send emails (for batch, you'd loop or use batch SES API)
    const results: SendResult[] = []

    for (const recipient of recipients) {
      try {
        const command = new SendEmailCommand({
          Source: from,
          Destination: {
            ToAddresses: [recipient],
          },
          Message: {
            Subject: {
              Data: subject,
              Charset: 'UTF-8',
            },
            Body: {
              Html: {
                Data: htmlBody,
                Charset: 'UTF-8',
              },
              ...(textBody && {
                Text: {
                  Data: textBody,
                  Charset: 'UTF-8',
                },
              }),
            },
          },
        })

        const response = await ses.send(command)

        results.push({
          success: true,
          messageId: response.MessageId,
        })
      } catch (error: any) {
        logger.error('Failed to send email', {
          userId,
          recipient,
          error: error.message,
        })

        results.push({
          success: false,
          error: error.message,
        })
      }
    }

    // Track successful sends for warmup
    const successfulSends = results.filter((r) => r.success).length
    if (successfulSends > 0) {
      await trackWarmupSend(userId, successfulSends)

      logger.info('Emails sent and tracked for warmup', {
        userId,
        count: successfulSends,
      })
    }

    // Return overall result
    const allSuccessful = results.every((r) => r.success)

    return {
      success: allSuccessful,
      messageId: results[0]?.messageId,
      error: allSuccessful ? undefined : 'Some emails failed to send',
    }
  } catch (error: any) {
    logger.error('Error in sendEmailWithWarmup', {
      userId,
      error: error.message,
    })

    return {
      success: false,
      error: error.message || 'Failed to send email',
    }
  }
}

/**
 * Send batch emails with warmup enforcement and rate limiting
 */
export async function sendBatchWithWarmup(
  userId: string,
  emails: Omit<SendEmailOptions, 'userId'>[]
): Promise<{
  sent: number
  failed: number
  blocked: number
  errors: string[]
}> {
  const totalEmails = emails.length

  // Check if user can send this many emails
  const warmupCheck = await canSendEmails(userId, totalEmails)

  if (!warmupCheck.allowed) {
    logger.warn('Batch send blocked by warmup limits', {
      userId,
      requested: totalEmails,
      limit: warmupCheck.limit,
      current: warmupCheck.current,
    })

    // Create alert
    await createWarmupAlert(
      userId,
      'limit_reached',
      'warning',
      'Cannot Send Batch - Limit Reached',
      `You tried to send ${totalEmails} emails but only have ${
        warmupCheck.limit! - warmupCheck.current!
      } sends remaining today.`,
      {
        limit: warmupCheck.limit,
        current: warmupCheck.current,
        requested: totalEmails,
      }
    )

    return {
      sent: 0,
      failed: 0,
      blocked: totalEmails,
      errors: [warmupCheck.reason || 'Blocked by warmup limits'],
    }
  }

  // Send emails
  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const email of emails) {
    const result = await sendEmailWithWarmup({
      ...email,
      userId,
    })

    if (result.success) {
      sent++
    } else if (result.blockedByWarmup) {
      // Stop if warmup limit is reached
      failed = emails.length - sent
      errors.push(result.error || 'Warmup limit reached')
      break
    } else {
      failed++
      errors.push(result.error || 'Unknown error')
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  logger.info('Batch send completed', {
    userId,
    total: totalEmails,
    sent,
    failed,
  })

  return {
    sent,
    failed,
    blocked: 0,
    errors,
  }
}

/**
 * Send campaign with warmup enforcement
 */
export async function sendCampaignWithWarmup(
  userId: string,
  campaignId: string,
  recipients: Array<{ email: string; name?: string }>,
  emailContent: {
    from: string
    subject: string
    htmlBody: string
    textBody?: string
  }
): Promise<{
  sent: number
  failed: number
  blocked: number
  remainingToday: number
}> {
  const totalRecipients = recipients.length

  // Check warmup limits
  const warmupCheck = await canSendEmails(userId, totalRecipients)

  if (!warmupCheck.allowed) {
    const remaining = warmupCheck.limit! - warmupCheck.current!

    logger.warn('Campaign blocked by warmup limits', {
      userId,
      campaignId,
      recipients: totalRecipients,
      remaining,
    })

    // Alert user about partial send option
    await createWarmupAlert(
      userId,
      'campaign_limited',
      'info',
      'Campaign Limited by Warmup',
      `Your campaign has ${totalRecipients} recipients, but you can only send ${remaining} more emails today. The campaign will be sent to the first ${remaining} recipients.`,
      {
        campaignId,
        totalRecipients,
        remaining,
      }
    )

    // Send to as many as possible
    const recipientsToSend = recipients.slice(0, remaining)

    if (recipientsToSend.length === 0) {
      return {
        sent: 0,
        failed: 0,
        blocked: totalRecipients,
        remainingToday: 0,
      }
    }

    // Send to partial list
    const emails = recipientsToSend.map((recipient) => ({
      from: emailContent.from,
      to: recipient.email,
      subject: emailContent.subject,
      htmlBody: emailContent.htmlBody,
      textBody: emailContent.textBody,
      campaignId,
      trackingEnabled: true,
    }))

    const result = await sendBatchWithWarmup(userId, emails)

    return {
      ...result,
      blocked: totalRecipients - recipientsToSend.length,
      remainingToday: 0,
    }
  }

  // Send to all recipients
  const emails = recipients.map((recipient) => ({
    from: emailContent.from,
    to: recipient.email,
    subject: emailContent.subject,
    htmlBody: emailContent.htmlBody,
    textBody: emailContent.textBody,
    campaignId,
    trackingEnabled: true,
  }))

  const result = await sendBatchWithWarmup(userId, emails)

  // Get updated remaining count
  const updatedWarmup = await canSendEmails(userId, 0)
  const remainingToday = updatedWarmup.allowed
    ? (updatedWarmup.limit || Infinity) - (updatedWarmup.current || 0)
    : 0

  return {
    ...result,
    remainingToday,
  }
}

/**
 * Preview send limits before sending
 */
export async function previewSendLimits(userId: string, emailCount: number): Promise<{
  canSend: boolean
  allowedCount: number
  blockedCount: number
  warmupStage: number
  dailyLimit: number
  alreadySent: number
  remainingToday: number
  message: string
}> {
  const warmupCheck = await canSendEmails(userId, emailCount)

  if (warmupCheck.allowed) {
    const remaining = (warmupCheck.limit || Infinity) - (warmupCheck.current || 0)

    return {
      canSend: true,
      allowedCount: emailCount,
      blockedCount: 0,
      warmupStage: 4,
      dailyLimit: warmupCheck.limit || Infinity,
      alreadySent: warmupCheck.current || 0,
      remainingToday: remaining,
      message: `You can send all ${emailCount} emails. ${remaining} sends remaining today.`,
    }
  }

  const allowed = Math.max(0, (warmupCheck.limit || 0) - (warmupCheck.current || 0))
  const blocked = emailCount - allowed

  return {
    canSend: allowed > 0,
    allowedCount: allowed,
    blockedCount: blocked,
    warmupStage: 1, // Would need to fetch actual stage
    dailyLimit: warmupCheck.limit || 0,
    alreadySent: warmupCheck.current || 0,
    remainingToday: allowed,
    message:
      allowed > 0
        ? `You can send ${allowed} of ${emailCount} emails. ${blocked} will be blocked by warmup limits.`
        : `Cannot send any emails. Daily limit of ${warmupCheck.limit} reached.`,
  }
}
