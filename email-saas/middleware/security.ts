// Security Middleware
// Applies security policies, rate limiting, CSRF protection, and session validation

import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import {
  handleCORSPreflight,
  addCORSHeaders,
  validateCSRFProtection,
  getSecurityHeaders,
  getRateLimitKey,
} from '@/lib/security/cors-csrf'
import { validateSession } from '@/lib/security/session-management'

/**
 * Initialize rate limiters
 */
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Rate limiters for different endpoints
const rateLimiters = {
  // General API rate limit: 100 requests per minute
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),

  // Auth endpoints: 5 attempts per minute (login, signup)
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: 'ratelimit:auth',
  }),

  // Email sending: 50 per hour
  email: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 h'),
    analytics: true,
    prefix: 'ratelimit:email',
  }),

  // Data export: 2 per day (GDPR exports are expensive)
  export: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(2, '1 d'),
    analytics: true,
    prefix: 'ratelimit:export',
  }),
}

/**
 * Determine which rate limiter to use based on path
 */
function getRateLimiter(pathname: string): Ratelimit | null {
  if (pathname.startsWith('/api/auth')) {
    return rateLimiters.auth
  }
  if (pathname.startsWith('/api/email/send')) {
    return rateLimiters.email
  }
  if (pathname.includes('/export')) {
    return rateLimiters.export
  }
  if (pathname.startsWith('/api')) {
    return rateLimiters.api
  }
  return null
}

/**
 * Apply rate limiting
 */
async function applyRateLimit(
  request: NextRequest,
  limiter: Ratelimit
): Promise<{ allowed: boolean; response?: NextResponse }> {
  const key = getRateLimitKey(request, 'ip')

  try {
    const { success, limit, reset, remaining } = await limiter.limit(key)

    if (!success) {
      const response = NextResponse.json(
        {
          error: 'Too many requests',
          message: 'You have exceeded the rate limit. Please try again later.',
          limit,
          remaining,
          reset,
        },
        { status: 429 }
      )

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', limit.toString())
      response.headers.set('X-RateLimit-Remaining', remaining.toString())
      response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString())
      response.headers.set('Retry-After', Math.ceil((reset - Date.now()) / 1000).toString())

      return { allowed: false, response }
    }

    return { allowed: true }
  } catch (error) {
    // If rate limiting fails, allow the request but log error
    console.error('Rate limiting error:', error)
    return { allowed: true }
  }
}

/**
 * Log security event
 */
async function logSecurityEvent(
  request: NextRequest,
  eventType: string,
  metadata: Record<string, any>
): Promise<void> {
  try {
    // In production, this would write to database
    // For now, we'll use structured logging
    console.log(
      JSON.stringify({
        type: 'security_event',
        event_type: eventType,
        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        user_agent: request.headers.get('user-agent'),
        path: request.nextUrl.pathname,
        method: request.method,
        metadata,
        timestamp: new Date().toISOString(),
      })
    )
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

/**
 * Main security middleware
 */
export async function securityMiddleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // 1. Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORSPreflight(request)
  }

  // 2. Apply rate limiting
  const limiter = getRateLimiter(pathname)
  if (limiter) {
    const { allowed, response } = await applyRateLimit(request, limiter)
    if (!allowed && response) {
      // Log rate limit exceeded
      await logSecurityEvent(request, 'rate_limit_exceeded', {
        path: pathname,
      })
      return response
    }
  }

  // 3. Validate CSRF for state-changing requests
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth')) {
    const csrfResult = await validateCSRFProtection(request)
    if (!csrfResult.isValid) {
      await logSecurityEvent(request, 'csrf_violation', {
        error: csrfResult.error,
        path: pathname,
      })

      return NextResponse.json(
        {
          error: 'CSRF validation failed',
          message: csrfResult.error,
        },
        { status: 403 }
      )
    }
  }

  // 4. Validate session for protected routes
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth')) {
    const sessionResult = await validateSession()
    if (!sessionResult.isValid) {
      await logSecurityEvent(request, 'invalid_session', {
        reason: sessionResult.reason,
        path: pathname,
      })

      return NextResponse.json(
        {
          error: 'Session invalid',
          message: sessionResult.reason,
        },
        { status: 401 }
      )
    }
  }

  // 5. Proceed with request
  const response = NextResponse.next()

  // 6. Add security headers
  const securityHeaders = getSecurityHeaders()
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // 7. Add CORS headers
  return addCORSHeaders(response, request)
}

/**
 * Middleware matcher configuration
 * Export this for use in middleware.ts
 */
export const securityMiddlewareConfig = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}

/**
 * Protected route middleware
 * Use this to protect specific routes that require authentication
 */
export async function protectedRoute(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Validate session
  const sessionResult = await validateSession()
  if (!sessionResult.isValid) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'You must be logged in to access this resource',
      },
      { status: 401 }
    )
  }

  // Call handler
  return handler(request)
}

/**
 * Admin route middleware
 * Use this to protect admin-only routes
 */
export async function adminRoute(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Validate session
  const sessionResult = await validateSession()
  if (!sessionResult.isValid) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'You must be logged in to access this resource',
      },
      { status: 401 }
    )
  }

  // Check if user is admin
  const isAdmin = sessionResult.sessionInfo?.user?.user_metadata?.role === 'admin'
  if (!isAdmin) {
    await logSecurityEvent(request, 'unauthorized_admin_access', {
      user_id: sessionResult.sessionInfo?.user?.id,
    })

    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
      },
      { status: 403 }
    )
  }

  // Call handler
  return handler(request)
}

/**
 * Rate limit specific endpoint
 * Use this as a wrapper for API routes that need custom rate limiting
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  limit: number,
  window: string
) {
  return async (request: NextRequest) => {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      analytics: true,
    })

    const { allowed, response } = await applyRateLimit(request, limiter)
    if (!allowed && response) {
      return response
    }

    return handler(request)
  }
}
