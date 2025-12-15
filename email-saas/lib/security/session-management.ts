// Session Management
// Handle session timeout, secure cookies, and session validation

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000

// Maximum session duration (7 days)
const MAX_SESSION_DURATION = 7 * 24 * 60 * 60 * 1000

export interface SessionInfo {
  userId: string
  email: string
  createdAt: number
  lastActivity: number
  expiresAt: number
  isValid: boolean
  timeUntilExpiry: number
}

/**
 * Get session information
 */
export async function getSessionInfo(): Promise<SessionInfo | null> {
  try {
    const supabase = await createClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session) {
      return null
    }

    const now = Date.now()
    const createdAt = new Date(session.user.created_at).getTime()
    const expiresAt = new Date(session.expires_at || 0).getTime()
    const lastActivity = now // Supabase updates this automatically

    const isValid = expiresAt > now

    return {
      userId: session.user.id,
      email: session.user.email!,
      createdAt,
      lastActivity,
      expiresAt,
      isValid,
      timeUntilExpiry: expiresAt - now,
    }
  } catch (error) {
    console.error('Failed to get session info:', error)
    return null
  }
}

/**
 * Check if session is still valid (not timed out)
 */
export async function isSessionValid(): Promise<boolean> {
  const sessionInfo = await getSessionInfo()

  if (!sessionInfo) {
    return false
  }

  return sessionInfo.isValid && sessionInfo.timeUntilExpiry > 0
}

/**
 * Refresh session (extend expiry)
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const supabase = await createClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession()

    if (error || !session) {
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to refresh session:', error)
    return false
  }
}

/**
 * Invalidate session (logout)
 */
export async function invalidateSession(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

/**
 * Set secure cookie options
 */
export function getSecureCookieOptions(): {
  httpOnly: boolean
  secure: boolean
  sameSite: 'lax' | 'strict' | 'none'
  maxAge: number
  path: string
} {
  const isProduction = process.env.NODE_ENV === 'production'

  return {
    httpOnly: true, // Prevent JavaScript access
    secure: isProduction, // HTTPS only in production
    sameSite: 'lax', // CSRF protection
    maxAge: MAX_SESSION_DURATION / 1000, // 7 days in seconds
    path: '/',
  }
}

/**
 * Track session activity (for auto-logout)
 */
export async function trackSessionActivity(): Promise<void> {
  const cookieStore = cookies()
  const now = Date.now().toString()

  cookieStore.set('last_activity', now, {
    ...getSecureCookieOptions(),
    httpOnly: false, // Need to read from client
  })
}

/**
 * Check if session has timed out due to inactivity
 */
export async function hasSessionTimedOut(): Promise<boolean> {
  const cookieStore = cookies()
  const lastActivity = cookieStore.get('last_activity')

  if (!lastActivity) {
    return false
  }

  const lastActivityTime = parseInt(lastActivity.value, 10)
  const now = Date.now()

  return now - lastActivityTime > SESSION_TIMEOUT
}

/**
 * Session validation middleware
 */
export async function validateSession(): Promise<{
  isValid: boolean
  reason?: string
  sessionInfo?: SessionInfo
}> {
  // Check if session exists
  const sessionInfo = await getSessionInfo()

  if (!sessionInfo) {
    return {
      isValid: false,
      reason: 'No active session',
    }
  }

  // Check if session has expired
  if (!sessionInfo.isValid) {
    return {
      isValid: false,
      reason: 'Session expired',
    }
  }

  // Check if session has timed out due to inactivity
  const timedOut = await hasSessionTimedOut()

  if (timedOut) {
    await invalidateSession()
    return {
      isValid: false,
      reason: 'Session timed out due to inactivity',
    }
  }

  // Update last activity
  await trackSessionActivity()

  return {
    isValid: true,
    sessionInfo,
  }
}

/**
 * Get all active sessions for a user (if storing session data in DB)
 */
export async function getUserSessions(userId: string): Promise<any[]> {
  const supabase = await createClient()

  // Note: Supabase doesn't expose all sessions by default
  // You'd need to implement custom session tracking in your DB

  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get user sessions:', error)
    return []
  }

  return data || []
}

/**
 * Revoke specific session
 */
export async function revokeSession(sessionId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('user_sessions')
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq('id', sessionId)

  return !error
}

/**
 * Revoke all sessions for a user (except current)
 */
export async function revokeAllOtherSessions(userId: string): Promise<number> {
  const supabase = await createClient()
  const sessionInfo = await getSessionInfo()

  if (!sessionInfo) {
    return 0
  }

  const { data, error } = await supabase
    .from('user_sessions')
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_active', true)
    .neq('id', sessionInfo.userId) // Keep current session active

  if (error) {
    console.error('Failed to revoke sessions:', error)
    return 0
  }

  return data?.length || 0
}

// Database schema for custom session tracking
/*
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session info
  session_token VARCHAR(255) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_type VARCHAR(50),
  location VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_reason VARCHAR(255)
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active, expires_at);
*/
