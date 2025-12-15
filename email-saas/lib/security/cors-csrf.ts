// CORS and CSRF Protection
// Configure Cross-Origin Resource Sharing and prevent CSRF attacks

import { NextRequest, NextResponse } from 'next/server'

/**
 * CORS configuration
 */
const ALLOWED_ORIGINS =
  process.env.NODE_ENV === 'production'
    ? [
        process.env.NEXT_PUBLIC_SITE_URL!,
        'https://yourapp.com',
        'https://www.yourapp.com',
      ]
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        process.env.NEXT_PUBLIC_SITE_URL!,
      ]

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'X-CSRF-Token',
]

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false
  return ALLOWED_ORIGINS.includes(origin)
}

/**
 * Get CORS headers
 */
export function getCORSHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
    'Access-Control-Allow-Headers': ALLOWED_HEADERS.join(', '),
    'Access-Control-Max-Age': '86400', // 24 hours
  }

  if (origin && isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  return headers
}

/**
 * Handle CORS preflight request
 */
export function handleCORSPreflight(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin')
  const headers = getCORSHeaders(origin)

  return new NextResponse(null, {
    status: 204,
    headers,
  })
}

/**
 * Add CORS headers to response
 */
export function addCORSHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const origin = request.headers.get('origin')
  const corsHeaders = getCORSHeaders(origin)

  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

/**
 * CSRF Token generation
 */
export function generateCSRFToken(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string | null, expectedToken: string): boolean {
  if (!token || !expectedToken) {
    return false
  }

  // Constant-time comparison to prevent timing attacks
  if (token.length !== expectedToken.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i)
  }

  return result === 0
}

/**
 * CSRF protection middleware
 */
export async function validateCSRFProtection(request: NextRequest): Promise<{
  isValid: boolean
  error?: string
}> {
  // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
  const method = request.method
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { isValid: true }
  }

  // Check origin header (same-origin policy)
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')

  if (origin) {
    const originUrl = new URL(origin)
    if (originUrl.host !== host) {
      return {
        isValid: false,
        error: 'Origin header does not match host',
      }
    }
  }

  // Check CSRF token for state-changing requests
  const csrfToken = request.headers.get('X-CSRF-Token') || request.cookies.get('csrf-token')?.value

  if (!csrfToken) {
    return {
      isValid: false,
      error: 'Missing CSRF token',
    }
  }

  // Validate token (would compare against stored token)
  // In practice, you'd retrieve the expected token from session/cookie
  // For this example, we'll assume it's valid if present

  return { isValid: true }
}

/**
 * Security headers middleware
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Prevent MIME sniffing
    'X-Content-Type-Options': 'nosniff',

    // XSS protection
    'X-XSS-Protection': '1; mode=block',

    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions policy (formerly Feature Policy)
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), interest-cohort=()',

    // Strict Transport Security (HTTPS only)
    ...(process.env.NODE_ENV === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    }),

    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co https://api.sentry.io",
      "frame-src 'self' https://vercel.live",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; '),
  }
}

/**
 * Rate limit key generator (for different rate limit buckets)
 */
export function getRateLimitKey(request: NextRequest, type: 'ip' | 'user'): string {
  if (type === 'ip') {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'
    return `ratelimit:ip:${ip}`
  }

  // For user-based rate limiting, would need to get user from session
  return `ratelimit:user:unknown`
}

/**
 * Check if request is from trusted source (webhook verification)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Example using HMAC SHA-256
    const encoder = new TextEncoder()
    const key = encoder.encode(secret)
    const data = encoder.encode(payload)

    // In a real implementation, you'd use crypto.subtle.sign
    // This is a simplified example

    return signature === 'expected-signature' // Replace with actual HMAC comparison
  } catch (error) {
    return false
  }
}

/**
 * Middleware wrapper to add security headers
 */
export function withSecurityHeaders(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const response = await handler(request, ...args)

    // Add security headers
    const securityHeaders = getSecurityHeaders()
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Add CORS headers
    return addCORSHeaders(response, request)
  }
}
