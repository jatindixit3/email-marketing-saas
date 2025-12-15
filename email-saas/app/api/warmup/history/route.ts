// API Route: GET /api/warmup/history
// Returns warmup daily history for charts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWarmupHistory } from '@/lib/services/warmup-service'
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

    // Get days from query params (default 30)
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30', 10)

    if (days < 1 || days > 365) {
      throw new ApiError(400, 'Days must be between 1 and 365', 'VALIDATION_ERROR')
    }

    // Get history
    const history = await getWarmupHistory(user.id, days)

    logger.info('Warmup history fetched', { userId: user.id, days, count: history.length })

    return NextResponse.json({
      success: true,
      data: history,
    })
  } catch (error) {
    return handleError(error, request.nextUrl.pathname)
  }
}
