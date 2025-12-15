// Rate Limit Middleware for API Routes

import { NextRequest, NextResponse } from 'next/server'
import { ratelimit } from '@/lib/rate-limit'
import { ApiError } from '@/lib/errors/api-error'

export async function withRateLimit(
  request: NextRequest,
  identifier: string // user ID or IP address
): Promise<{ success: boolean; error?: NextResponse }> {
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier)

  if (!success) {
    const error = new ApiError(
      429,
      'Too many requests. Please try again later.',
      'RATE_LIMIT_EXCEEDED',
      {
        limit,
        remaining,
        reset: new Date(reset).toISOString(),
      }
    )

    return {
      success: false,
      error: NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
            statusCode: 429,
            details: error.details,
            timestamp: new Date().toISOString(),
          },
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
          },
        }
      ),
    }
  }

  return { success: true }
}
