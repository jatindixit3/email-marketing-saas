// Sentry Server Configuration
// This file configures Sentry for Node.js (API routes, server components)

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  integrations: [
    // Automatically instrument Node.js libraries and frameworks
    ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
  ],

  // Filter out unwanted errors
  beforeSend(event, hint) {
    // Don't send errors in development
    if (process.env.NODE_ENV === 'development') {
      return null
    }

    // Add additional context
    if (event.request) {
      // Remove sensitive headers
      const headers = event.request.headers || {}
      delete headers.cookie
      delete headers.authorization
    }

    return event
  },

  // Ignore certain errors
  ignoreErrors: [
    // Database connection errors (usually temporary)
    'ECONNREFUSED',
    'ETIMEDOUT',

    // Supabase auth errors (user-caused)
    'Invalid login credentials',
    'Email not confirmed',

    // Rate limit errors (expected)
    'Rate limit exceeded',
  ],
})
