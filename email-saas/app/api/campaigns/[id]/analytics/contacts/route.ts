// Campaign Contact Engagement API
// GET /api/campaigns/[id]/analytics/contacts

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
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

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

    // Get contact engagement
    const contacts = await TrackingAnalytics.getContactEngagement(
      campaignId,
      limit,
      offset
    );

    return NextResponse.json({
      contacts,
      limit,
      offset,
      total: contacts.length,
    });
  } catch (error: any) {
    console.error('Error fetching contact engagement:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contact engagement' },
      { status: 500 }
    );
  }
}
