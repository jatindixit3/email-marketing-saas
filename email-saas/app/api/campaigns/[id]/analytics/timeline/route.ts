// Campaign Timeline Analytics API
// GET /api/campaigns/[id]/analytics/timeline

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
    const { searchParams } = new URL(request.url);
    const interval = (searchParams.get('interval') || 'hour') as
      | 'hour'
      | 'day'
      | 'week';

    // Validate interval
    if (!['hour', 'day', 'week'].includes(interval)) {
      return NextResponse.json(
        { error: 'Invalid interval. Must be: hour, day, or week' },
        { status: 400 }
      );
    }

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

    // Get engagement timeline
    const timeline = await TrackingAnalytics.getEngagementTimeline(
      campaignId,
      interval
    );

    return NextResponse.json({ timeline, interval });
  } catch (error: any) {
    console.error('Error fetching timeline analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch timeline analytics' },
      { status: 500 }
    );
  }
}
