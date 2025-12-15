// Single List API
// GET /api/lists/[id] - Get list details
// PATCH /api/lists/[id] - Update list
// DELETE /api/lists/[id] - Delete list

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

    // Get list with statistics
    const { data: list, error } = await supabase
      .from('list_overview')
      .select('*')
      .eq('list_id', listId)
      .eq('user_id', user.id)
      .single();

    if (error || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    return NextResponse.json({ list });
  } catch (error: any) {
    console.error('Error fetching list:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch list' },
      { status: 500 }
    );
  }
}

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const listId = params.id;
    const body = await request.json();
    const { name, description, is_default, allow_duplicates } = body;

    // Verify list belongs to user
    const { data: existingList, error: fetchError } = await supabase
      .from('contact_lists')
      .select('id, user_id')
      .eq('id', listId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existingList) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    if (existingList.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check for duplicate name (if name is being changed)
    if (name && name.trim() !== '') {
      const { data: duplicate } = await supabase
        .from('contact_lists')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', name)
        .neq('id', listId)
        .is('deleted_at', null)
        .single();

      if (duplicate) {
        return NextResponse.json(
          { error: 'A list with this name already exists' },
          { status: 400 }
        );
      }
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await supabase
        .from('contact_lists')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .neq('id', listId);
    }

    // Update list
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (is_default !== undefined) updateData.is_default = is_default;
    if (allow_duplicates !== undefined) updateData.allow_duplicates = allow_duplicates;

    const { data: list, error } = await supabase
      .from('contact_lists')
      .update(updateData)
      .eq('id', listId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ list });
  } catch (error: any) {
    console.error('Error updating list:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update list' },
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

    // Verify list belongs to user
    const { data: existingList, error: fetchError } = await supabase
      .from('contact_lists')
      .select('id, user_id, is_default')
      .eq('id', listId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existingList) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    if (existingList.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Prevent deleting default list
    if (existingList.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete the default list' },
        { status: 400 }
      );
    }

    // Soft delete
    const { error } = await supabase
      .from('contact_lists')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', listId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: 'List deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting list:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete list' },
      { status: 500 }
    );
  }
}
