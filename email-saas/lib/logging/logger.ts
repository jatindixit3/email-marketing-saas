// Centralized Logging Utility

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogContext {
  userId?: string
  action?: string
  resource?: string
  duration?: number
  [key: string]: any
}

class Logger {
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    }

    // In production, send to logging service (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to external logging service
      console[level === 'error' ? 'error' : 'log'](JSON.stringify(logEntry))
    } else {
      console[level === 'error' ? 'error' : 'log'](
        `[${level.toUpperCase()}] ${message}`,
        context || ''
      )
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context)
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, context)
    }
  }
}

export const logger = new Logger()
