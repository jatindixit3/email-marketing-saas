// Campaign Analytics API
// GET /api/campaigns/[id]/analytics

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TrackingAnalytics } from '@/lib/services/tracking-analytics';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaignId = params.id;

    // Verify campaign belongs to user
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, user_id')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get performance metrics
    const performance = await TrackingAnalytics.getCampaignPerformance(
      campaignId,
      user.id
    );

    if (!performance) {
      return NextResponse.json(
        { error: 'Failed to fetch campaign performance' },
        { status: 500 }
      );
    }

    return NextResponse.json(performance);
  } catch (error: any) {
    console.error('Error fetching campaign analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
