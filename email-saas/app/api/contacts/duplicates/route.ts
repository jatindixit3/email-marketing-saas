// Contact Duplicates API
// GET /api/contacts/duplicates - Find duplicate contacts
// POST /api/contacts/duplicates/merge - Merge duplicate contacts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    // Find duplicates using database function
    const { data: duplicates, error } = await supabase.rpc(
      'find_duplicate_contacts',
      { p_user_id: user.id }
    );

    if (error) {
      throw new Error(error.message);
    }

    // Get full contact details for each duplicate pair
    const duplicatePairs = await Promise.all(
      (duplicates || []).map(async (dup: any) => {
        const { data: contacts } = await supabase
          .from('contacts')
          .select('*')
          .in('id', [dup.contact_id_1, dup.contact_id_2]);

        return {
          primary: contacts?.[0],
          duplicate: contacts?.[1],
          similarity_score: dup.similarity_score,
          matched_fields: dup.matched_fields,
        };
      })
    );

    return NextResponse.json({
      duplicates: duplicatePairs.filter((pair) => pair.primary && pair.duplicate),
      total: duplicatePairs.length,
    });
  } catch (error: any) {
    console.error('Error finding duplicates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to find duplicates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { primary_id, duplicate_id, merge_strategy = 'keep_primary' } = body;

    if (!primary_id || !duplicate_id) {
      return NextResponse.json(
        { error: 'primary_id and duplicate_id are required' },
        { status: 400 }
      );
    }

    // Verify both contacts belong to user
    const { data: contacts, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .in('id', [primary_id, duplicate_id])
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (fetchError || !contacts || contacts.length !== 2) {
      return NextResponse.json(
        { error: 'Contacts not found or do not belong to user' },
        { status: 400 }
      );
    }

    const primary = contacts.find((c) => c.id === primary_id);
    const duplicate = contacts.find((c) => c.id === duplicate_id);

    if (!primary || !duplicate) {
      return NextResponse.json(
        { error: 'Invalid contact IDs' },
        { status: 400 }
      );
    }

    // Merge contacts based on strategy
    let mergedData: any = {};

    if (merge_strategy === 'keep_primary') {
      // Keep all primary data, fill in missing fields from duplicate
      mergedData = {
        email: primary.email,
        first_name: primary.first_name || duplicate.first_name,
        last_name: primary.last_name || duplicate.last_name,
        phone: primary.phone || duplicate.phone,
        company: primary.company || duplicate.company,
        tags: Array.from(
          new Set([...(primary.tags || []), ...(duplicate.tags || [])])
        ),
        metadata: { ...duplicate.metadata, ...primary.metadata },
        custom_fields: { ...duplicate.custom_fields, ...primary.custom_fields },
        total_opens: (primary.total_opens || 0) + (duplicate.total_opens || 0),
        total_clicks: (primary.total_clicks || 0) + (duplicate.total_clicks || 0),
        last_engaged_at:
          primary.last_engaged_at && duplicate.last_engaged_at
            ? new Date(primary.last_engaged_at) > new Date(duplicate.last_engaged_at)
              ? primary.last_engaged_at
              : duplicate.last_engaged_at
            : primary.last_engaged_at || duplicate.last_engaged_at,
      };
    } else if (merge_strategy === 'keep_newest') {
      // Keep data from the most recently created contact
      const newest =
        new Date(primary.created_at) > new Date(duplicate.created_at)
          ? primary
          : duplicate;
      const oldest =
        newest.id === primary.id ? duplicate : primary;

      mergedData = {
        email: newest.email,
        first_name: newest.first_name || oldest.first_name,
        last_name: newest.last_name || oldest.last_name,
        phone: newest.phone || oldest.phone,
        company: newest.company || oldest.company,
        tags: Array.from(
          new Set([...(newest.tags || []), ...(oldest.tags || [])])
        ),
        metadata: { ...oldest.metadata, ...newest.metadata },
        custom_fields: { ...oldest.custom_fields, ...newest.custom_fields },
        total_opens: (newest.total_opens || 0) + (oldest.total_opens || 0),
        total_clicks: (newest.total_clicks || 0) + (oldest.total_clicks || 0),
        last_engaged_at:
          newest.last_engaged_at && oldest.last_engaged_at
            ? new Date(newest.last_engaged_at) > new Date(oldest.last_engaged_at)
              ? newest.last_engaged_at
              : oldest.last_engaged_at
            : newest.last_engaged_at || oldest.last_engaged_at,
      };
    }

    // Update primary contact with merged data
    const { error: updateError } = await supabase
      .from('contacts')
      .update(mergedData)
      .eq('id', primary_id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Transfer list memberships from duplicate to primary
    const { data: duplicateLists } = await supabase
      .from('contact_list_members')
      .select('list_id')
      .eq('contact_id', duplicate_id);

    if (duplicateLists && duplicateLists.length > 0) {
      const memberships = duplicateLists.map((m) => ({
        list_id: m.list_id,
        contact_id: primary_id,
        added_by: 'merge',
      }));

      await supabase
        .from('contact_list_members')
        .upsert(memberships, {
          onConflict: 'contact_id,list_id',
          ignoreDuplicates: true,
        });
    }

    // Transfer email events from duplicate to primary
    await supabase
      .from('email_events')
      .update({ contact_id: primary_id })
      .eq('contact_id', duplicate_id);

    // Soft delete duplicate contact
    const { error: deleteError } = await supabase
      .from('contacts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', duplicate_id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    // Record the merge
    await supabase.from('contact_duplicates').insert({
      user_id: user.id,
      primary_contact_id: primary_id,
      duplicate_contact_id: duplicate_id,
      similarity_score: 1.0,
      matched_fields: ['merged'],
      status: 'merged',
      merged_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      merged_contact_id: primary_id,
      deleted_contact_id: duplicate_id,
      message: 'Contacts merged successfully',
    });
  } catch (error: any) {
    console.error('Error merging contacts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to merge contacts' },
      { status: 500 }
    );
  }
}
