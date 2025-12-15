// API Route: GET /api/security/sessions
// Manage user sessions

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/security/sessions
 * Get all active sessions for current user
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all sessions for user
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('last_activity', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      sessions: sessions || [],
      currentSessionId: sessions?.[0]?.id, // Most recent is current
    })
  } catch (error: any) {
    console.error('Get sessions error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve sessions',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/security/sessions
 * Revoke a session or all sessions except current
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const revokeAll = searchParams.get('revoke_all') === 'true'

    if (revokeAll) {
      // Revoke all sessions except current
      const { error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_reason: 'User revoked all sessions',
        })
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (error) throw error

      // Log audit event
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        event_type: 'sessions_revoked_all',
        event_category: 'security',
        metadata: { revoked_at: new Date().toISOString() },
      })

      return NextResponse.json({
        message: 'All sessions revoked successfully',
      })
    } else if (sessionId) {
      // Revoke specific session
      const { error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_reason: 'User revoked session',
        })
        .eq('id', sessionId)
        .eq('user_id', user.id) // Ensure user owns the session

      if (error) throw error

      // Log audit event
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        event_type: 'session_revoked',
        event_category: 'security',
        metadata: { session_id: sessionId, revoked_at: new Date().toISOString() },
      })

      return NextResponse.json({
        message: 'Session revoked successfully',
      })
    } else {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'session_id or revoke_all parameter required',
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Revoke session error:', error)
    return NextResponse.json(
      {
        error: 'Failed to revoke session',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
