// Campaign Device Analytics API
// GET /api/campaigns/[id]/analytics/devices

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

    // Get device breakdown
    const devices = await TrackingAnalytics.getDeviceBreakdown(campaignId);

    // Get email client breakdown
    const emailClients = await TrackingAnalytics.getEmailClientBreakdown(
      campaignId
    );

    return NextResponse.json({
      devices,
      emailClients,
    });
  } catch (error: any) {
    console.error('Error fetching device analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch device analytics' },
      { status: 500 }
    );
  }
}
