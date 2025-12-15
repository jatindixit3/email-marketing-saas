// AWS SES Email Sending Service
// Handles bulk email sending with rate limiting and error handling

import { SESv2Client, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-sesv2';
import {
  prepareTrackedEmail,
  replaceMergeTags,
  generateUnsubscribeLink,
  addUnsubscribeFooter,
} from './tracking';

// SES Configuration
interface SESConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  fromEmail: string;
  fromName?: string;
  replyToEmail?: string;
  configurationSetName?: string; // For tracking bounces/complaints
}

// Email recipient data
export interface EmailRecipient {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  customFields?: Record<string, any>;
}

// Email send request
export interface SendEmailRequest {
  campaignId: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  recipients: EmailRecipient[];
  fromName?: string;
  fromEmail?: string;
  replyToEmail?: string;
  baseUrl: string;
}

// Send result for a single email
export interface SendResult {
  recipientId: string;
  email: string;
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

// Batch send result
export interface BatchSendResult {
  total: number;
  successful: number;
  failed: number;
  results: SendResult[];
}

/**
 * AWS SES Email Service
 * Handles sending emails through AWS SES with tracking and rate limiting
 */
export class SESEmailService {
  private client: SESv2Client;
  private config: SESConfig;
  private sendingRate: number; // emails per second
  private batchSize: number;

  constructor(config: SESConfig, sendingRate = 14, batchSize = 500) {
    this.config = config;
    this.sendingRate = sendingRate;
    this.batchSize = batchSize;

    // Initialize SES client
    this.client = new SESv2Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  /**
   * Send a single email
   */
  private async sendSingleEmail(
    recipient: EmailRecipient,
    subject: string,
    htmlContent: string,
    textContent: string | undefined,
    campaignId: string,
    fromEmail: string,
    fromName: string | undefined,
    replyToEmail: string | undefined,
    baseUrl: string
  ): Promise<SendResult> {
    try {
      // Replace merge tags with recipient data
      const personalizedSubject = replaceMergeTags(subject, recipient);
      let personalizedHtml = replaceMergeTags(htmlContent, recipient);
      const personalizedText = textContent
        ? replaceMergeTags(textContent, recipient)
        : undefined;

      // Add tracking (pixel + link wrapping)
      personalizedHtml = prepareTrackedEmail(
        personalizedHtml,
        campaignId,
        recipient.id,
        baseUrl
      );

      // Add unsubscribe footer
      const unsubscribeUrl = generateUnsubscribeLink(
        recipient.id,
        campaignId,
        baseUrl
      );
      personalizedHtml = addUnsubscribeFooter(personalizedHtml, unsubscribeUrl);

      // Prepare SES send parameters
      const params: SendEmailCommandInput = {
        FromEmailAddress: fromName
          ? `${fromName} <${fromEmail}>`
          : fromEmail,
        Destination: {
          ToAddresses: [recipient.email],
        },
        Content: {
          Simple: {
            Subject: {
              Data: personalizedSubject,
              Charset: 'UTF-8',
            },
            Body: {
              Html: {
                Data: personalizedHtml,
                Charset: 'UTF-8',
              },
              ...(personalizedText && {
                Text: {
                  Data: personalizedText,
                  Charset: 'UTF-8',
                },
              }),
            },
          },
        },
        ReplyToAddresses: replyToEmail ? [replyToEmail] : undefined,
        ConfigurationSetName: this.config.configurationSetName,
        EmailTags: [
          { Name: 'campaign_id', Value: campaignId },
          { Name: 'contact_id', Value: recipient.id },
        ],
      };

      // Send email via SES
      const command = new SendEmailCommand(params);
      const response = await this.client.send(command);

      return {
        recipientId: recipient.id,
        email: recipient.email,
        success: true,
        messageId: response.MessageId,
      };
    } catch (error: any) {
      console.error(`Failed to send email to ${recipient.email}:`, error);

      return {
        recipientId: recipient.id,
        email: recipient.email,
        success: false,
        error: error.message || 'Unknown error',
        errorCode: error.Code || error.name,
      };
    }
  }

  /**
   * Send emails in batches with rate limiting
   */
  async sendBatch(request: SendEmailRequest): Promise<BatchSendResult> {
    const results: SendResult[] = [];
    const fromEmail = request.fromEmail || this.config.fromEmail;
    const fromName = request.fromName || this.config.fromName;
    const replyToEmail = request.replyToEmail || this.config.replyToEmail;

    // Calculate delay between emails (in milliseconds)
    const delayBetweenEmails = Math.ceil(1000 / this.sendingRate);

    console.log(
      `Sending ${request.recipients.length} emails at ${this.sendingRate} emails/second`
    );

    // Send emails with rate limiting
    for (let i = 0; i < request.recipients.length; i++) {
      const recipient = request.recipients[i];

      // Send email
      const result = await this.sendSingleEmail(
        recipient,
        request.subject,
        request.htmlContent,
        request.textContent,
        request.campaignId,
        fromEmail,
        fromName,
        replyToEmail,
        request.baseUrl
      );

      results.push(result);

      // Log progress every 100 emails
      if ((i + 1) % 100 === 0) {
        console.log(`Progress: ${i + 1}/${request.recipients.length} emails sent`);
      }

      // Rate limiting: wait before sending next email
      if (i < request.recipients.length - 1) {
        await this.delay(delayBetweenEmails);
      }
    }

    // Calculate statistics
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      total: request.recipients.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Send campaign in multiple batches
   * Useful for very large campaigns that exceed SES limits
   */
  async sendCampaign(
    request: SendEmailRequest,
    onBatchComplete?: (batchNumber: number, result: BatchSendResult) => void
  ): Promise<BatchSendResult> {
    const allResults: SendResult[] = [];
    const batches = this.splitIntoBatches(request.recipients, this.batchSize);

    console.log(
      `Campaign ${request.campaignId}: Sending ${request.recipients.length} emails in ${batches.length} batches`
    );

    for (let i = 0; i < batches.length; i++) {
      const batchNumber = i + 1;
      console.log(
        `Starting batch ${batchNumber}/${batches.length} (${batches[i].length} emails)`
      );

      // Send batch
      const batchRequest: SendEmailRequest = {
        ...request,
        recipients: batches[i],
      };

      const batchResult = await this.sendBatch(batchRequest);
      allResults.push(...batchResult.results);

      // Callback for progress tracking
      if (onBatchComplete) {
        onBatchComplete(batchNumber, batchResult);
      }

      console.log(
        `Batch ${batchNumber}/${batches.length} complete: ${batchResult.successful} sent, ${batchResult.failed} failed`
      );

      // Small delay between batches (1 second)
      if (i < batches.length - 1) {
        await this.delay(1000);
      }
    }

    // Final statistics
    const successful = allResults.filter((r) => r.success).length;
    const failed = allResults.filter((r) => !r.success).length;

    return {
      total: request.recipients.length,
      successful,
      failed,
      results: allResults,
    };
  }

  /**
   * Split recipients into batches
   */
  private splitIntoBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get SES sending statistics (optional - for monitoring)
   */
  async getSendingStatistics(): Promise<any> {
    // This would use GetAccountCommand from AWS SDK
    // Implementation depends on your monitoring needs
    return null;
  }

  /**
   * Verify email address or domain (for SES sandbox)
   */
  async verifyEmailAddress(email: string): Promise<void> {
    // This would use CreateEmailIdentityCommand
    // Useful for development/testing in SES sandbox
    console.log(`Email verification would be sent to: ${email}`);
  }
}

/**
 * Create SES service instance from environment variables
 */
export function createSESService(): SESEmailService {
  const config: SESConfig = {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    fromEmail: process.env.AWS_SES_FROM_EMAIL || '',
    fromName: process.env.AWS_SES_FROM_NAME,
    replyToEmail: process.env.AWS_SES_REPLY_TO_EMAIL,
    configurationSetName: process.env.AWS_SES_CONFIGURATION_SET,
  };

  // Validate required config
  if (!config.accessKeyId || !config.secretAccessKey || !config.fromEmail) {
    throw new Error(
      'Missing required AWS SES configuration. Check environment variables.'
    );
  }

  const sendingRate = parseInt(process.env.AWS_SES_SENDING_RATE || '14', 10);
  const batchSize = parseInt(process.env.AWS_SES_BATCH_SIZE || '500', 10);

  return new SESEmailService(config, sendingRate, batchSize);
}
