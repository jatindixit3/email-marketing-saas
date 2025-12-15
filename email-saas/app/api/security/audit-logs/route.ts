// API Route: GET /api/security/audit-logs
// Retrieve security audit logs for current user

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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const eventType = searchParams.get('event_type')

    // Build query
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by event type if provided
    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    const { data: logs, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      logs,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: count ? offset + limit < count : false,
      },
    })
  } catch (error: any) {
    console.error('Audit logs error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve audit logs',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
