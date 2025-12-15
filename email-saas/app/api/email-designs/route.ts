// API Routes for Email Designs
// Save and retrieve email designs from database

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/email-designs
 * Get all email designs for current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isTemplate = searchParams.get('isTemplate') === 'true';
    const category = searchParams.get('category');

    // Build query
    let query = supabase
      .from('email_designs')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (isTemplate !== null) {
      query = query.eq('is_template', isTemplate);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      designs: data,
    });
  } catch (error: any) {
    console.error('Error fetching email designs:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email-designs
 * Create a new email design
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      design,
      html,
      category,
      isTemplate = false,
      thumbnailUrl,
    } = body;

    // Validation
    if (!name || !design || !html) {
      return NextResponse.json(
        { error: 'Name, design, and HTML are required' },
        { status: 400 }
      );
    }

    // Insert design
    const { data, error } = await supabase
      .from('email_designs')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        design,
        html,
        category: category || null,
        is_template: isTemplate,
        thumbnail_url: thumbnailUrl || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      design: data,
    });
  } catch (error: any) {
    console.error('Error creating email design:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
