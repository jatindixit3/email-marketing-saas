// API Route: GET /api/health/email
// Email service health check endpoint

import { NextResponse } from 'next/server'
import { SESClient, GetSendQuotaCommand } from '@aws-sdk/client-ses'

export async function GET() {
  try {
    const ses = new SESClient({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })

    const start = Date.now()

    // Check SES quota to verify connection
    const command = new GetSendQuotaCommand({})
    const response = await ses.send(command)

    const latency = Date.now() - start

    return NextResponse.json({
      status: 'healthy',
      emailService: 'connected',
      quota: {
        max24Hour: response.Max24HourSend,
        sent24Hour: response.SentLast24Hours,
        remaining: (response.Max24HourSend || 0) - (response.SentLast24Hours || 0),
      },
      latency: `${latency}ms`,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        emailService: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
