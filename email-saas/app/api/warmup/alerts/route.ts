// API Route: GET /api/warmup/alerts
// Returns warmup alerts for the user

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWarmupAlerts, markAlertAsRead } from '@/lib/services/warmup-service'
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

    // Get unread only from query params
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    // Get alerts
    const alerts = await getWarmupAlerts(user.id, unreadOnly)

    logger.info('Warmup alerts fetched', {
      userId: user.id,
      unreadOnly,
      count: alerts.length,
    })

    return NextResponse.json({
      success: true,
      data: alerts,
    })
  } catch (error) {
    return handleError(error, request.nextUrl.pathname)
  }
}

// Mark alert as read
export async function PATCH(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()
    const { alertId } = body

    if (!alertId) {
      throw new ApiError(400, 'Alert ID is required', 'VALIDATION_ERROR')
    }

    // Mark as read
    await markAlertAsRead(alertId)

    logger.info('Alert marked as read', { userId: user.id, alertId })

    return NextResponse.json({
      success: true,
      message: 'Alert marked as read',
    })
  } catch (error) {
    return handleError(error, request.nextUrl.pathname)
  }
}
