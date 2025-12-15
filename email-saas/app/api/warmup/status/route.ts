// API Route: GET /api/warmup/status
// Returns warmup status for the authenticated user

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWarmupStatus } from '@/lib/services/warmup-service'
import { handleError, ApiError } from '@/lib/errors/error-handler'
import { logger } from '@/lib/logging/logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED')
    }

    // Get warmup status
    const status = await getWarmupStatus(user.id)

    if (!status) {
      throw new ApiError(404, 'Warmup status not found', 'NOT_FOUND')
    }

    logger.info('Warmup status fetched', { userId: user.id })

    return NextResponse.json({
      success: true,
      data: status,
    })
  } catch (error) {
    return handleError(error, request.nextUrl.pathname)
  }
}
