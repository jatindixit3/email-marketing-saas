// API Routes for Individual Email Design
// Get, update, and delete specific email designs

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/email-designs/[id]
 * Get a specific email design
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('email_designs')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Design not found' }, { status: 404 });
      }
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      design: data,
    });
  } catch (error: any) {
    console.error('Error fetching email design:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/email-designs/[id]
 * Update an email design
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, design, html, category, thumbnailUrl } = body;

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (design !== undefined) updates.design = design;
    if (html !== undefined) updates.html = html;
    if (category !== undefined) updates.category = category;
    if (thumbnailUrl !== undefined) updates.thumbnail_url = thumbnailUrl;

    // Update design
    const { data, error } = await supabase
      .from('email_designs')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Design not found' }, { status: 404 });
      }
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      design: data,
    });
  } catch (error: any) {
    console.error('Error updating email design:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/email-designs/[id]
 * Delete (soft delete) an email design
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete
    const { error } = await supabase
      .from('email_designs')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Design deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting email design:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
