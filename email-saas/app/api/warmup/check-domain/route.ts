// API Route: POST /api/warmup/check-domain
// Checks DNS authentication for a domain

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkDomainAuthentication } from '@/lib/services/dns-authentication'
import { handleError, ApiError } from '@/lib/errors/error-handler'
import { logger } from '@/lib/logging/logger'

export async function POST(request: NextRequest) {
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
    const { domain, dkimSelector } = body

    if (!domain) {
      throw new ApiError(400, 'Domain is required', 'VALIDATION_ERROR')
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/
    if (!domainRegex.test(domain)) {
      throw new ApiError(400, 'Invalid domain format', 'VALIDATION_ERROR')
    }

    logger.info('Checking domain authentication', { userId: user.id, domain })

    // Check domain authentication
    const authResult = await checkDomainAuthentication(domain, dkimSelector)

    // Save results to database
    const { error: upsertError } = await supabase
      .from('domain_authentication')
      .upsert(
        {
          user_id: user.id,
          domain: domain,
          spf_record: authResult.spf.record,
          spf_verified: authResult.spf.verified,
          spf_last_checked: new Date().toISOString(),
          dkim_record: authResult.dkim.record,
          dkim_verified: authResult.dkim.verified,
          dkim_last_checked: new Date().toISOString(),
          dmarc_record: authResult.dmarc.record,
          dmarc_verified: authResult.dmarc.verified,
          dmarc_last_checked: new Date().toISOString(),
          mx_records: authResult.mx.records,
          mx_verified: authResult.mx.verified,
          mx_last_checked: new Date().toISOString(),
          verification_status: authResult.allVerified ? 'verified' : 'failed',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,domain',
        }
      )

    if (upsertError) {
      logger.error('Failed to save domain auth results', {
        userId: user.id,
        domain,
        error: upsertError.message,
      })
    }

    // Update warmup table
    await supabase
      .from('email_warmup')
      .update({
        domain,
        spf_verified: authResult.spf.verified,
        dkim_verified: authResult.dkim.verified,
        dmarc_verified: authResult.dmarc.verified,
        last_dns_check_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    logger.info('Domain authentication checked', {
      userId: user.id,
      domain,
      score: authResult.score,
      allVerified: authResult.allVerified,
    })

    return NextResponse.json({
      success: true,
      data: authResult,
    })
  } catch (error) {
    return handleError(error, request.nextUrl.pathname)
  }
}
