// Contact Lists API
// GET /api/lists - List all lists
// POST /api/lists - Create new list

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

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('include_stats') === 'true';

    if (includeStats) {
      // Get lists with statistics from view
      const { data: lists, error } = await supabase
        .from('list_overview')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({ lists: lists || [] });
    } else {
      // Get basic lists
      const { data: lists, error } = await supabase
        .from('contact_lists')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({ lists: lists || [] });
    }
  } catch (error: any) {
    console.error('Error fetching lists:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lists' },
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
    const { name, description, is_default, allow_duplicates } = body;

    // Validate input
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'List name is required' },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const { data: existing } = await supabase
      .from('contact_lists')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', name)
      .is('deleted_at', null)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A list with this name already exists' },
        { status: 400 }
      );
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await supabase
        .from('contact_lists')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    // Create new list
    const { data: list, error } = await supabase
      .from('contact_lists')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        is_default: is_default || false,
        allow_duplicates: allow_duplicates || false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ list }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating list:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create list' },
      { status: 500 }
    );
  }
}
