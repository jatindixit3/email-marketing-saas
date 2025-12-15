// API Route: GET /api/security/events
// Retrieve security events (admin only)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = user.user_metadata?.role === 'admin'
    if (!isAdmin) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Only admins can access security events',
        },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const severity = searchParams.get('severity')
    const resolved = searchParams.get('resolved')

    // Build query
    let query = supabase
      .from('security_events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by severity if provided
    if (severity) {
      query = query.eq('severity', severity)
    }

    // Filter by resolved status
    if (resolved !== null) {
      query = query.eq('resolved', resolved === 'true')
    }

    const { data: events, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      events,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: count ? offset + limit < count : false,
      },
    })
  } catch (error: any) {
    console.error('Security events error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve security events',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/security/events
 * Resolve a security event (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = user.user_metadata?.role === 'admin'
    if (!isAdmin) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Only admins can resolve security events',
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { eventId, resolved } = body

    if (!eventId) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'eventId is required',
        },
        { status: 400 }
      )
    }

    // Update event
    const { error } = await supabase
      .from('security_events')
      .update({
        resolved: resolved !== false,
        resolved_at: resolved !== false ? new Date().toISOString() : null,
        resolved_by: user.id,
      })
      .eq('id', eventId)

    if (error) throw error

    return NextResponse.json({
      message: resolved !== false ? 'Event resolved' : 'Event reopened',
    })
  } catch (error: any) {
    console.error('Resolve security event error:', error)
    return NextResponse.json(
      {
        error: 'Failed to resolve security event',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
