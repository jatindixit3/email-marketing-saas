// API Route: /api/user/consent
// Manage user consents (GDPR compliance)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  recordConsent,
  getUserConsents,
  revokeConsent,
  ConsentType,
  getCurrentPrivacyPolicyVersion,
} from '@/lib/security/gdpr-compliance'

/**
 * GET /api/user/consent
 * Get all user consents
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

    const consents = await getUserConsents(user.id)
    const currentVersion = await getCurrentPrivacyPolicyVersion()

    return NextResponse.json({
      consents,
      currentPrivacyPolicyVersion: currentVersion,
    })
  } catch (error: any) {
    console.error('Get consents error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve consents',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/consent
 * Record a new consent
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { consentType, granted } = body

    if (!consentType || typeof granted !== 'boolean') {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'consentType and granted are required',
        },
        { status: 400 }
      )
    }

    // Validate consent type
    if (!Object.values(ConsentType).includes(consentType)) {
      return NextResponse.json(
        {
          error: 'Invalid consent type',
          message: `Valid types: ${Object.values(ConsentType).join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Get request metadata
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const privacyPolicyVersion = await getCurrentPrivacyPolicyVersion()

    // Record consent
    const consent = await recordConsent(user.id, consentType, granted, {
      ip_address: ipAddress,
      user_agent: userAgent,
      privacy_policy_version: privacyPolicyVersion,
    })

    return NextResponse.json({
      message: granted ? 'Consent granted' : 'Consent revoked',
      consent,
    })
  } catch (error: any) {
    console.error('Record consent error:', error)
    return NextResponse.json(
      {
        error: 'Failed to record consent',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/user/consent
 * Revoke a consent
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
    const consentType = searchParams.get('type') as ConsentType

    if (!consentType) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'Consent type is required',
        },
        { status: 400 }
      )
    }

    // Validate consent type
    if (!Object.values(ConsentType).includes(consentType)) {
      return NextResponse.json(
        {
          error: 'Invalid consent type',
          message: `Valid types: ${Object.values(ConsentType).join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Cannot revoke necessary consent
    if (consentType === ConsentType.NECESSARY) {
      return NextResponse.json(
        {
          error: 'Cannot revoke necessary consent',
          message: 'Necessary consents are required to use the service',
        },
        { status: 400 }
      )
    }

    // Get request metadata
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Revoke consent
    await revokeConsent(user.id, consentType, {
      ip_address: ipAddress,
      user_agent: userAgent,
    })

    return NextResponse.json({
      message: 'Consent revoked successfully',
      consentType,
    })
  } catch (error: any) {
    console.error('Revoke consent error:', error)
    return NextResponse.json(
      {
        error: 'Failed to revoke consent',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
