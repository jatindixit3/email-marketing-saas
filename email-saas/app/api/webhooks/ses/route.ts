// AWS SES Webhook Handler
// Handles bounces, complaints, and delivery notifications from AWS SNS

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * AWS SNS notification types
 */
interface SNSNotification {
  Type: string;
  MessageId: string;
  Token?: string; // For subscription confirmation
  TopicArn: string;
  Subject?: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
  SubscribeURL?: string;
  UnsubscribeURL?: string;
}

/**
 * SES Event types
 */
interface SESBounceEvent {
  notificationType: 'Bounce';
  bounce: {
    bounceType: 'Undetermined' | 'Permanent' | 'Transient';
    bounceSubType: string;
    bouncedRecipients: Array<{
      emailAddress: string;
      action?: string;
      status?: string;
      diagnosticCode?: string;
    }>;
    timestamp: string;
    feedbackId: string;
  };
  mail: {
    messageId: string;
    timestamp: string;
    source: string;
    destination: string[];
    tags?: Record<string, string[]>;
  };
}

interface SESComplaintEvent {
  notificationType: 'Complaint';
  complaint: {
    complainedRecipients: Array<{
      emailAddress: string;
    }>;
    timestamp: string;
    feedbackId: string;
    complaintFeedbackType?: string;
  };
  mail: {
    messageId: string;
    timestamp: string;
    source: string;
    destination: string[];
    tags?: Record<string, string[]>;
  };
}

interface SESDeliveryEvent {
  notificationType: 'Delivery';
  delivery: {
    timestamp: string;
    processingTimeMillis: number;
    recipients: string[];
    smtpResponse: string;
  };
  mail: {
    messageId: string;
    timestamp: string;
    source: string;
    destination: string[];
    tags?: Record<string, string[]>;
  };
}

type SESEvent = SESBounceEvent | SESComplaintEvent | SESDeliveryEvent;

export async function POST(request: NextRequest) {
  try {
    const body: SNSNotification = await request.json();

    console.log('Received SNS notification:', body.Type);

    // Handle SNS subscription confirmation
    if (body.Type === 'SubscriptionConfirmation') {
      console.log('SNS Subscription confirmation received');
      console.log('Subscribe URL:', body.SubscribeURL);

      // In production, you should verify the signature and auto-confirm
      // For now, log the URL for manual confirmation
      return NextResponse.json({
        message: 'Please confirm subscription manually using the SubscribeURL',
        subscribeUrl: body.SubscribeURL,
      });
    }

    // Handle SNS notifications
    if (body.Type === 'Notification') {
      const message: SESEvent = JSON.parse(body.Message);

      console.log('SES Event type:', message.notificationType);

      // Process based on notification type
      switch (message.notificationType) {
        case 'Bounce':
          await handleBounce(message);
          break;

        case 'Complaint':
          await handleComplaint(message);
          break;

        case 'Delivery':
          await handleDelivery(message);
          break;

        default:
          console.log('Unknown notification type:', message.notificationType);
      }

      return NextResponse.json({ message: 'Event processed' });
    }

    return NextResponse.json({ message: 'Unknown SNS message type' });
  } catch (error) {
    console.error('Error processing SES webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Handle bounce events
 */
async function handleBounce(event: SESBounceEvent): Promise<void> {
  const supabase = await createClient();

  console.log(`Processing bounce: ${event.bounce.bounceType}`);

  // Extract campaign and contact IDs from message tags
  const tags = event.mail.tags || {};
  const campaignId = tags.campaign_id?.[0];
  const contactId = tags.contact_id?.[0];

  for (const recipient of event.bounce.bouncedRecipients) {
    console.log(`Bounce for ${recipient.emailAddress}: ${event.bounce.bounceType}`);

    // Find contact by email
    let actualContactId = contactId;

    if (!actualContactId) {
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', recipient.emailAddress)
        .single();

      actualContactId = contact?.id;
    }

    if (!actualContactId) {
      console.error(`Contact not found for email: ${recipient.emailAddress}`);
      continue;
    }

    // Save bounce event
    if (campaignId) {
      await supabase.from('email_events').insert({
        campaign_id: campaignId,
        contact_id: actualContactId,
        event_type: 'bounced',
        bounce_type: event.bounce.bounceType.toLowerCase(),
        bounce_reason: recipient.diagnosticCode || event.bounce.bounceSubType,
        metadata: {
          feedback_id: event.bounce.feedbackId,
          message_id: event.mail.messageId,
        },
      });
    }

    // Update contact status if permanent bounce
    if (event.bounce.bounceType === 'Permanent') {
      await supabase
        .from('contacts')
        .update({ status: 'bounced' })
        .eq('id', actualContactId);

      console.log(`Contact ${actualContactId} marked as bounced`);
    }
  }
}

/**
 * Handle complaint events (spam reports)
 */
async function handleComplaint(event: SESComplaintEvent): Promise<void> {
  const supabase = await createClient();

  console.log('Processing complaint');

  // Extract campaign and contact IDs from message tags
  const tags = event.mail.tags || {};
  const campaignId = tags.campaign_id?.[0];
  const contactId = tags.contact_id?.[0];

  for (const recipient of event.complaint.complainedRecipients) {
    console.log(`Complaint from ${recipient.emailAddress}`);

    // Find contact by email
    let actualContactId = contactId;

    if (!actualContactId) {
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', recipient.emailAddress)
        .single();

      actualContactId = contact?.id;
    }

    if (!actualContactId) {
      console.error(`Contact not found for email: ${recipient.emailAddress}`);
      continue;
    }

    // Save complaint event
    if (campaignId) {
      await supabase.from('email_events').insert({
        campaign_id: campaignId,
        contact_id: actualContactId,
        event_type: 'complained',
        metadata: {
          feedback_id: event.complaint.feedbackId,
          feedback_type: event.complaint.complaintFeedbackType,
          message_id: event.mail.messageId,
        },
      });
    }

    // Update contact status to complained
    await supabase
      .from('contacts')
      .update({ status: 'complained' })
      .eq('id', actualContactId);

    console.log(`Contact ${actualContactId} marked as complained`);
  }
}

/**
 * Handle delivery events
 */
async function handleDelivery(event: SESDeliveryEvent): Promise<void> {
  const supabase = await createClient();

  console.log('Processing delivery notification');

  // Extract campaign and contact IDs from message tags
  const tags = event.mail.tags || {};
  const campaignId = tags.campaign_id?.[0];
  const contactId = tags.contact_id?.[0];

  if (!campaignId || !contactId) {
    console.log('Missing campaign or contact ID in delivery event');
    return;
  }

  // Save delivery event
  await supabase.from('email_events').insert({
    campaign_id: campaignId,
    contact_id: contactId,
    event_type: 'delivered',
    metadata: {
      message_id: event.mail.messageId,
      processing_time_ms: event.delivery.processingTimeMillis,
      smtp_response: event.delivery.smtpResponse,
    },
  });

  console.log(`Delivery event saved for campaign ${campaignId}, contact ${contactId}`);
}
