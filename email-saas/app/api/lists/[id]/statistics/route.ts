// List Statistics API
// GET /api/lists/[id]/statistics

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const listId = params.id;

    // Verify list belongs to user
    const { data: list } = await supabase
      .from('contact_lists')
      .select('id, user_id')
      .eq('id', listId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    // Get comprehensive statistics using database function
    const { data: stats, error: statsError } = await supabase.rpc(
      'get_list_stats',
      { p_list_id: listId }
    );

    if (statsError) {
      console.error('Error from get_list_stats:', statsError);
      // Fallback to manual queries
      return getFallbackStatistics(supabase, listId);
    }

    const statisticsData = stats?.[0] || {};

    // Get growth timeline (last 30 days)
    const { data: timeline } = await supabase
      .from('list_statistics')
      .select('*')
      .eq('list_id', listId)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: true });

    // Get tag distribution
    const { data: members } = await supabase
      .from('contact_list_members')
      .select(`
        contacts (tags)
      `)
      .eq('list_id', listId);

    const tagCounts: Record<string, number> = {};
    members?.forEach((member: any) => {
      const tags = member.contacts?.tags || [];
      tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    return NextResponse.json({
      statistics: {
        total_contacts: statisticsData.total_contacts || 0,
        active_contacts: statisticsData.active_contacts || 0,
        subscribed_contacts: statisticsData.subscribed_contacts || 0,
        unsubscribed_contacts: statisticsData.unsubscribed_contacts || 0,
        bounced_contacts: statisticsData.bounced_contacts || 0,
        growth_7_days: statisticsData.growth_7_days || 0,
        growth_30_days: statisticsData.growth_30_days || 0,
        avg_engagement_rate: statisticsData.avg_engagement_rate || 0,
      },
      timeline: timeline || [],
      top_tags: topTags,
    });
  } catch (error: any) {
    console.error('Error fetching list statistics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

// Fallback statistics calculation
async function getFallbackStatistics(supabase: any, listId: string) {
  try {
    // Get all members
    const { data: members } = await supabase
      .from('contact_list_members')
      .select(`
        contact_id,
        added_at,
        contacts (
          subscription_status,
          last_engaged_at
        )
      `)
      .eq('list_id', listId);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      total_contacts: members?.length || 0,
      subscribed_contacts:
        members?.filter((m: any) => m.contacts?.subscription_status === 'subscribed')
          .length || 0,
      unsubscribed_contacts:
        members?.filter(
          (m: any) => m.contacts?.subscription_status === 'unsubscribed'
        ).length || 0,
      bounced_contacts:
        members?.filter((m: any) => m.contacts?.subscription_status === 'bounced')
          .length || 0,
      active_contacts:
        members?.filter((m: any) => m.contacts?.subscription_status === 'subscribed')
          .length || 0,
      growth_7_days:
        members?.filter((m: any) => new Date(m.added_at) >= sevenDaysAgo).length ||
        0,
      growth_30_days:
        members?.filter((m: any) => new Date(m.added_at) >= thirtyDaysAgo).length ||
        0,
      avg_engagement_rate: 0,
    };

    return NextResponse.json({
      statistics: stats,
      timeline: [],
      top_tags: [],
    });
  } catch (error: any) {
    console.error('Error in fallback statistics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
