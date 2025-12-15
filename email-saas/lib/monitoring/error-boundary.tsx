'use client'

// Error Boundary Components
// Catches errors in React components and logs to Sentry

import React, { Component, ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

// Generic Error Boundary
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Update state
    this.setState({ errorInfo })

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="max-w-md border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/5 p-8">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-red-500/10 p-4">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
            </div>

            <h2 className="mb-3 text-center text-2xl font-bold text-foreground">
              Something went wrong
            </h2>

            <p className="mb-6 text-center text-sm text-muted-foreground">
              We've been notified and are working on a fix. Please try again.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 rounded-lg bg-red-950/50 p-4">
                <p className="mb-2 text-xs font-semibold text-red-400">Error Details:</p>
                <pre className="overflow-auto text-xs text-red-300">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={this.handleReset} className="flex-1" variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                className="flex-1 bg-gradient-to-r from-teal-500 to-purple-500"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Page-level Error Boundary with custom styling
export class PageErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        errorBoundary: 'page',
      },
    })

    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto max-w-2xl px-4 py-16">
          <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/5 p-8">
            <div className="mb-6 text-center">
              <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-red-500" />
              <h1 className="mb-2 text-3xl font-bold text-foreground">Page Error</h1>
              <p className="text-muted-foreground">
                This page encountered an error and couldn't be displayed.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 rounded-lg bg-red-950/50 p-4">
                <p className="mb-2 text-sm font-semibold text-red-400">Error:</p>
                <pre className="overflow-auto text-xs text-red-300">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}

            <div className="flex justify-center gap-3">
              <Button onClick={this.handleReset} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button
                onClick={() => (window.location.href = '/dashboard')}
                className="bg-gradient-to-r from-teal-500 to-purple-500"
              >
                Go to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Component-level Error Boundary (smaller, inline errors)
export class ComponentErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        errorBoundary: 'component',
      },
    })

    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="font-semibold text-red-700">Component Error</p>
              <p className="mt-1 text-sm text-red-600">
                This component couldn't be loaded. Please refresh the page.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <pre className="mt-2 overflow-auto rounded bg-red-950/50 p-2 text-xs text-red-300">
                  {this.state.error.toString()}
                </pre>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for manual error reporting
export function useErrorReporting() {
  const reportError = React.useCallback((error: Error, context?: Record<string, any>) => {
    Sentry.captureException(error, {
      extra: context,
    })
  }, [])

  const reportMessage = React.useCallback(
    (message: string, level: 'info' | 'warning' | 'error' = 'error') => {
      Sentry.captureMessage(message, level)
    },
    []
  )

  return { reportError, reportMessage }
}
