// API Route: Schedule a campaign
// POST /api/campaigns/[id]/schedule

import { NextRequest, NextResponse } from 'next/server';
import { CampaignScheduler } from '@/lib/scheduler/campaign-scheduler';
import { toUTC } from '@/lib/scheduler/timezone';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const campaignId = params.id;
    const body = await request.json();

    const { scheduledTime, timezone } = body;

    // Validate input
    if (!scheduledTime || !timezone) {
      return NextResponse.json(
        { error: 'scheduledTime and timezone are required' },
        { status: 400 }
      );
    }

    // Convert to UTC
    const utcTime = toUTC(scheduledTime, timezone);

    // Schedule the campaign
    const result = await CampaignScheduler.scheduleCampaign({
      campaignId,
      scheduledTime: utcTime,
      timezone,
      userId: user.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      scheduledAt: utcTime.toISOString(),
      timezone,
    });
  } catch (error: any) {
    console.error('Error scheduling campaign:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to schedule campaign' },
      { status: 500 }
    );
  }
}

// GET: Get campaign schedule info
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const campaignId = params.id;

    // Get schedule info
    const result = await CampaignScheduler.getCampaignSchedule(
      campaignId,
      user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Error fetching campaign schedule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaign schedule' },
      { status: 500 }
    );
  }
}

// DELETE: Cancel scheduled campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const campaignId = params.id;

    // Cancel the campaign
    const result = await CampaignScheduler.cancelScheduledCampaign(
      campaignId,
      user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign cancelled successfully',
    });
  } catch (error: any) {
    console.error('Error cancelling campaign:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel campaign' },
      { status: 500 }
    );
  }
}

// PATCH: Reschedule campaign
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const campaignId = params.id;
    const body = await request.json();

    const { scheduledTime, timezone } = body;

    // Validate input
    if (!scheduledTime || !timezone) {
      return NextResponse.json(
        { error: 'scheduledTime and timezone are required' },
        { status: 400 }
      );
    }

    // Reschedule the campaign
    const result = await CampaignScheduler.rescheduleCampaign(
      {
        campaignId,
        newScheduledTime: new Date(scheduledTime),
        timezone,
      },
      user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign rescheduled successfully',
    });
  } catch (error: any) {
    console.error('Error rescheduling campaign:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reschedule campaign' },
      { status: 500 }
    );
  }
}
