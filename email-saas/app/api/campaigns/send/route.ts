// API Route for Sending Campaigns
// Used by the dashboard to queue campaigns for sending

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CampaignService } from '@/lib/services/campaign-service';

/**
 * POST /api/campaigns/send
 * Queue a campaign for sending
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { campaignId, sendImmediately = true, scheduledAt } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Verify campaign belongs to user
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, user_id, status')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (campaign.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Send campaign
    let result;

    if (sendImmediately) {
      result = await CampaignService.sendCampaign(campaignId, user.id, {
        sendImmediately: true,
      });
    } else if (scheduledAt) {
      result = await CampaignService.scheduleCampaign(
        campaignId,
        user.id,
        new Date(scheduledAt)
      );
    } else {
      return NextResponse.json(
        { error: 'Either sendImmediately or scheduledAt must be provided' },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        jobIds: result.jobIds,
        totalRecipients: result.totalRecipients,
        totalBatches: result.totalBatches,
      },
    });
  } catch (error: any) {
    console.error('Error in send campaign API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/campaigns/send?campaignId=xxx
 * Get campaign sending status
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get campaign ID from query params
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Get campaign stats
    const stats = await CampaignService.getCampaignStats(campaignId, user.id);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error getting campaign stats:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
