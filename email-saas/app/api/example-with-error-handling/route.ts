// Example API Route with Complete Error Handling
// This demonstrates all error handling patterns

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleError, handleSupabaseError } from '@/lib/errors/error-handler'
import { ApiError, SuccessResponse } from '@/lib/errors/api-error'
import { logger } from '@/lib/logging/logger'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { validateCampaignForm } from '@/lib/validation/forms'
import { sanitize } from '@/lib/validation/validators'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED')
    }

    // 2. Rate limiting
    const rateLimitResult = await withRateLimit(request, user.id)
    if (!rateLimitResult.success) {
      return rateLimitResult.error!
    }

    // 3. Fetch data
    const { data: campaigns, error: dbError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (dbError) {
      throw handleSupabaseError(dbError)
    }

    // 4. Log success
    logger.info('Campaigns fetched successfully', {
      userId: user.id,
      count: campaigns?.length || 0,
    })

    // 5. Return success response
    const response: SuccessResponse = {
      success: true,
      data: campaigns,
    }

    return NextResponse.json(response)
  } catch (error) {
    return handleError(error, request.nextUrl.pathname)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED')
    }

    // 2. Rate limiting
    const rateLimitResult = await withRateLimit(request, user.id)
    if (!rateLimitResult.success) {
      return rateLimitResult.error!
    }

    // 3. Parse and sanitize body
    const body = await request.json()
    const sanitizedData = {
      name: sanitize.string(body.name),
      subject: sanitize.string(body.subject),
      body_html: body.body_html || '',
      list_ids: body.list_ids,
    }

    // 4. Validate
    const validation = validateCampaignForm(sanitizedData)
    if (!validation.valid) {
      throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', {
        errors: validation.errors,
      })
    }

    // 5. Create campaign
    const { data: campaign, error: dbError } = await supabase
      .from('campaigns')
      .insert({
        user_id: user.id,
        name: sanitizedData.name,
        subject: sanitizedData.subject,
        html_content: sanitizedData.body_html,
        status: 'draft',
      })
      .select()
      .single()

    if (dbError) {
      throw handleSupabaseError(dbError)
    }

    // 6. Log success
    logger.info('Campaign created', {
      userId: user.id,
      campaignId: campaign.id,
    })

    // 7. Return success response
    const response: SuccessResponse = {
      success: true,
      data: campaign,
      message: 'Campaign created successfully',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error, request.nextUrl.pathname)
  }
}
