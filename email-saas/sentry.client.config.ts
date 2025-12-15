// Sentry Client Configuration
// This file configures Sentry for the browser

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Capture Replay for Sessions
  replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors
  replaysSessionSampleRate: 0.1, // Capture 10% of all sessions

  integrations: [
    new Sentry.Replay({
      // Mask all text content, but allow recording of user interactions
      maskAllText: true,
      blockAllMedia: true,
    }),
    new Sentry.BrowserTracing({
      // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/yourapp\.com/,
        /^https:\/\/.*\.vercel\.app/,
      ],
    }),
  ],

  // Filter out unwanted errors
  beforeSend(event, hint) {
    // Don't send errors in development
    if (process.env.NODE_ENV === 'development') {
      return null
    }

    // Filter out known browser extension errors
    const error = hint.originalException as Error
    if (error && error.message) {
      const message = error.message.toLowerCase()

      // Chrome extensions
      if (message.includes('extension')) return null

      // Third-party script errors
      if (message.includes('script error')) return null

      // Network errors (these are usually user connectivity issues)
      if (message.includes('network') || message.includes('fetch')) return null
    }

    return event
  },

  // Ignore certain errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'canvas.contentDocument',

    // Random plugins/extensions
    'conduitPage',

    // Network errors
    'NetworkError',
    'Failed to fetch',
    'Load failed',

    // ResizeObserver errors (harmless)
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
  ],

  // Don't report errors from certain URLs
  denyUrls: [
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,

    // Firefox extensions
    /^moz-extension:\/\//i,

    // Safari extensions
    /^safari-extension:\/\//i,
  ],
})
