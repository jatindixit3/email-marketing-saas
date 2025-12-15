// Structured Logging System
// JSON-formatted logs with request IDs, user context, and log levels

import { v4 as uuidv4 } from 'uuid'
import * as Sentry from '@sentry/nextjs'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogContext {
  requestId?: string
  userId?: string
  userEmail?: string
  action?: string
  resource?: string
  metadata?: Record<string, any>
  duration?: number
  error?: Error
  [key: string]: any
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context: LogContext
  environment: string
  service: string
}

class StructuredLogger {
  private serviceName: string
  private environment: string
  private requestId: string | null = null

  constructor() {
    this.serviceName = 'email-saas'
    this.environment = process.env.NODE_ENV || 'development'
  }

  /**
   * Set request ID for tracing
   */
  setRequestId(requestId: string) {
    this.requestId = requestId
  }

  /**
   * Generate new request ID
   */
  generateRequestId(): string {
    return uuidv4()
  }

  /**
   * Format log entry as JSON
   */
  private formatLog(level: LogLevel, message: string, context: LogContext = {}): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        requestId: context.requestId || this.requestId || undefined,
      },
      environment: this.environment,
      service: this.serviceName,
    }
  }

  /**
   * Output log entry
   */
  private output(entry: LogEntry) {
    const jsonLog = JSON.stringify(entry)

    // In production, write to stdout (captured by logging service)
    if (this.environment === 'production') {
      console.log(jsonLog)
    } else {
      // In development, pretty print
      const emoji = {
        debug: '🐛',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        fatal: '💀',
      }[entry.level]

      console.log(
        `${emoji} [${entry.level.toUpperCase()}] ${entry.message}`,
        entry.context
      )
    }

    // Send errors to Sentry
    if (entry.level === 'error' || entry.level === 'fatal') {
      if (entry.context.error) {
        Sentry.captureException(entry.context.error, {
          level: entry.level === 'fatal' ? 'fatal' : 'error',
          extra: entry.context,
        })
      } else {
        Sentry.captureMessage(entry.message, {
          level: entry.level === 'fatal' ? 'fatal' : 'error',
          extra: entry.context,
        })
      }
    }
  }

  /**
   * Debug log (development only)
   */
  debug(message: string, context: LogContext = {}) {
    if (this.environment === 'development') {
      const entry = this.formatLog('debug', message, context)
      this.output(entry)
    }
  }

  /**
   * Info log
   */
  info(message: string, context: LogContext = {}) {
    const entry = this.formatLog('info', message, context)
    this.output(entry)
  }

  /**
   * Warning log
   */
  warn(message: string, context: LogContext = {}) {
    const entry = this.formatLog('warn', message, context)
    this.output(entry)

    // Send warnings to Sentry in production
    if (this.environment === 'production') {
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: context,
      })
    }
  }

  /**
   * Error log
   */
  error(message: string, context: LogContext = {}) {
    const entry = this.formatLog('error', message, context)
    this.output(entry)
  }

  /**
   * Fatal error log (application crash)
   */
  fatal(message: string, context: LogContext = {}) {
    const entry = this.formatLog('fatal', message, context)
    this.output(entry)
  }

  /**
   * Log with custom level
   */
  log(level: LogLevel, message: string, context: LogContext = {}) {
    const entry = this.formatLog(level, message, context)
    this.output(entry)
  }

  /**
   * Create a child logger with preset context
   */
  child(context: LogContext): ChildLogger {
    return new ChildLogger(this, context)
  }

  /**
   * Log HTTP request
   */
  httpRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context: LogContext = {}
  ) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'

    this.log(level, `${method} ${url} - ${statusCode}`, {
      ...context,
      method,
      url,
      statusCode,
      duration,
    })
  }

  /**
   * Log database query
   */
  dbQuery(
    operation: string,
    table: string,
    duration: number,
    rowCount?: number,
    context: LogContext = {}
  ) {
    const level = duration > 1000 ? 'warn' : 'info'

    this.log(level, `Database ${operation} on ${table}`, {
      ...context,
      operation,
      table,
      duration,
      rowCount,
    })
  }

  /**
   * Log user action
   */
  userAction(action: string, userId: string, context: LogContext = {}) {
    this.info(`User action: ${action}`, {
      ...context,
      action,
      userId,
    })
  }

  /**
   * Log business event
   */
  businessEvent(event: string, context: LogContext = {}) {
    this.info(`Business event: ${event}`, {
      ...context,
      event,
    })
  }
}

/**
 * Child logger with preset context
 */
class ChildLogger {
  constructor(
    private parent: StructuredLogger,
    private presetContext: LogContext
  ) {}

  private mergeContext(context: LogContext = {}): LogContext {
    return {
      ...this.presetContext,
      ...context,
    }
  }

  debug(message: string, context?: LogContext) {
    this.parent.debug(message, this.mergeContext(context))
  }

  info(message: string, context?: LogContext) {
    this.parent.info(message, this.mergeContext(context))
  }

  warn(message: string, context?: LogContext) {
    this.parent.warn(message, this.mergeContext(context))
  }

  error(message: string, context?: LogContext) {
    this.parent.error(message, this.mergeContext(context))
  }

  fatal(message: string, context?: LogContext) {
    this.parent.fatal(message, this.mergeContext(context))
  }

  log(level: LogLevel, message: string, context?: LogContext) {
    this.parent.log(level, message, this.mergeContext(context))
  }
}

// Export singleton instance
export const logger = new StructuredLogger()

// Export request ID middleware helper
export function withRequestId<T>(
  handler: (logger: StructuredLogger, requestId: string) => T
): T {
  const requestId = logger.generateRequestId()
  logger.setRequestId(requestId)

  try {
    return handler(logger, requestId)
  } finally {
    logger.setRequestId(null as any)
  }
}

// Helper to create logger with user context
export function createUserLogger(userId: string, userEmail?: string) {
  return logger.child({
    userId,
    userEmail,
  })
}

// Helper to create logger with request context
export function createRequestLogger(requestId: string, method: string, url: string) {
  return logger.child({
    requestId,
    method,
    url,
  })
}
