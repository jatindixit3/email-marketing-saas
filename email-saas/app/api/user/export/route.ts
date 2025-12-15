// API Route: POST /api/user/export
// Export all user data (GDPR Article 20 - Right to Data Portability)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exportUserData } from '@/lib/security/gdpr-compliance'
import { withRateLimit } from '@/middleware/security'

async function handler(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Export all user data
    const exportData = await exportUserData(user.id)

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-${user.id}-${Date.now()}.json"`,
      },
    })
  } catch (error: any) {
    console.error('Data export error:', error)
    return NextResponse.json(
      {
        error: 'Failed to export data',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

// Apply rate limiting: 2 exports per day
export const POST = withRateLimit(handler, 2, '1 d')
