// List Contacts API
// GET /api/lists/[id]/contacts - Get contacts in list
// POST /api/lists/[id]/contacts - Add contacts to list
// DELETE /api/lists/[id]/contacts - Remove contacts from list

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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || ''; // 'subscribed', 'unsubscribed', 'bounced'
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];

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

    // Build query
    let query = supabase
      .from('contact_list_members')
      .select(`
        contact_id,
        added_at,
        added_by,
        contacts (
          id,
          email,
          first_name,
          last_name,
          phone,
          company,
          subscription_status,
          tags,
          metadata,
          created_at,
          last_engaged_at,
          total_opens,
          total_clicks
        )
      `)
      .eq('list_id', listId);

    // Apply filters
    if (search) {
      query = query.or(
        `contacts.email.ilike.%${search}%,contacts.first_name.ilike.%${search}%,contacts.last_name.ilike.%${search}%`,
        { foreignTable: 'contacts' }
      );
    }

    if (status) {
      query = query.eq('contacts.subscription_status', status);
    }

    if (tags.length > 0) {
      query = query.contains('contacts.tags', tags);
    }

    // Get total count
    const { count } = await supabase
      .from('contact_list_members')
      .select('*', { count: 'exact', head: true })
      .eq('list_id', listId);

    // Execute query with pagination
    const { data: members, error } = await query
      .order('added_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(error.message);
    }

    // Transform data
    const contacts = (members || []).map((member: any) => ({
      ...member.contacts,
      added_at: member.added_at,
      added_by: member.added_by,
    }));

    return NextResponse.json({
      contacts,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (offset + limit) < (count || 0),
      },
    });
  } catch (error: any) {
    console.error('Error fetching list contacts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const listId = params.id;
    const body = await request.json();
    const { contact_ids, added_by = 'manual' } = body;

    if (!contact_ids || !Array.isArray(contact_ids) || contact_ids.length === 0) {
      return NextResponse.json(
        { error: 'contact_ids array is required' },
        { status: 400 }
      );
    }

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

    // Verify all contacts belong to user
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id')
      .in('id', contact_ids)
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (!contacts || contacts.length !== contact_ids.length) {
      return NextResponse.json(
        { error: 'Some contacts not found or do not belong to user' },
        { status: 400 }
      );
    }

    // Add contacts to list (upsert to handle duplicates)
    const members = contact_ids.map((contactId) => ({
      list_id: listId,
      contact_id: contactId,
      added_by,
    }));

    const { data: inserted, error } = await supabase
      .from('contact_list_members')
      .upsert(members, {
        onConflict: 'contact_id,list_id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      added: inserted?.length || 0,
      message: `${inserted?.length || 0} contact(s) added to list`,
    });
  } catch (error: any) {
    console.error('Error adding contacts to list:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add contacts' },
      { status: 500 }
    );
  }
}

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const listId = params.id;
    const body = await request.json();
    const { contact_ids } = body;

    if (!contact_ids || !Array.isArray(contact_ids) || contact_ids.length === 0) {
      return NextResponse.json(
        { error: 'contact_ids array is required' },
        { status: 400 }
      );
    }

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

    // Remove contacts from list
    const { error } = await supabase
      .from('contact_list_members')
      .delete()
      .eq('list_id', listId)
      .in('contact_id', contact_ids);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      removed: contact_ids.length,
      message: `${contact_ids.length} contact(s) removed from list`,
    });
  } catch (error: any) {
    console.error('Error removing contacts from list:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove contacts' },
      { status: 500 }
    );
  }
}
