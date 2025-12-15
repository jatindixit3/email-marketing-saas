// API Route: GET /api/health/db
// Database health check endpoint

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const start = Date.now()

    // Simple query to check connection
    const { error } = await supabase
      .from('email_warmup')
      .select('id')
      .limit(1)
      .single()

    const latency = Date.now() - start

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows, which is fine
      throw error
    }

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      latency: `${latency}ms`,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
