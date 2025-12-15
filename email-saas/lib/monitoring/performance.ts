// Performance Monitoring
// Track page loads, API calls, database queries, and custom metrics

import * as Sentry from '@sentry/nextjs'

interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count'
  tags?: Record<string, string>
}

/**
 * Track custom performance metric
 */
export function trackMetric(metric: PerformanceMetric) {
  // Send to Sentry
  Sentry.metrics.distribution(metric.name, metric.value, {
    unit: metric.unit,
    tags: metric.tags,
  })

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${metric.name}: ${metric.value}${metric.unit}`, metric.tags)
  }
}

/**
 * Measure function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const start = performance.now()

  try {
    const result = await fn()
    const duration = performance.now() - start

    trackMetric({
      name,
      value: duration,
      unit: 'ms',
      tags: { ...tags, status: 'success' },
    })

    return result
  } catch (error) {
    const duration = performance.now() - start

    trackMetric({
      name,
      value: duration,
      unit: 'ms',
      tags: { ...tags, status: 'error' },
    })

    throw error
  }
}

/**
 * Measure synchronous function execution time
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  tags?: Record<string, string>
): T {
  const start = performance.now()

  try {
    const result = fn()
    const duration = performance.now() - start

    trackMetric({
      name,
      value: duration,
      unit: 'ms',
      tags: { ...tags, status: 'success' },
    })

    return result
  } catch (error) {
    const duration = performance.now() - start

    trackMetric({
      name,
      value: duration,
      unit: 'ms',
      tags: { ...tags, status: 'error' },
    })

    throw error
  }
}

/**
 * Track API response time
 */
export function trackAPICall(endpoint: string, method: string, duration: number, status: number) {
  trackMetric({
    name: 'api.response_time',
    value: duration,
    unit: 'ms',
    tags: {
      endpoint,
      method,
      status: status.toString(),
      status_class: Math.floor(status / 100) + 'xx',
    },
  })

  // Alert on slow API calls (>2 seconds)
  if (duration > 2000) {
    Sentry.captureMessage(`Slow API call: ${method} ${endpoint} (${duration}ms)`, {
      level: 'warning',
      tags: {
        endpoint,
        method,
        duration: duration.toString(),
      },
    })
  }
}

/**
 * Track database query performance
 */
export function trackDatabaseQuery(
  operation: string,
  table: string,
  duration: number,
  rowCount?: number
) {
  trackMetric({
    name: 'database.query_time',
    value: duration,
    unit: 'ms',
    tags: {
      operation,
      table,
    },
  })

  // Track row count if provided
  if (rowCount !== undefined) {
    trackMetric({
      name: 'database.rows_affected',
      value: rowCount,
      unit: 'count',
      tags: {
        operation,
        table,
      },
    })
  }

  // Alert on slow queries (>1 second)
  if (duration > 1000) {
    Sentry.captureMessage(`Slow database query: ${operation} on ${table} (${duration}ms)`, {
      level: 'warning',
      tags: {
        operation,
        table,
        duration: duration.toString(),
        rows: rowCount?.toString(),
      },
    })
  }
}

/**
 * Performance Timer class for manual timing
 */
export class PerformanceTimer {
  private startTime: number
  private name: string
  private tags: Record<string, string>

  constructor(name: string, tags: Record<string, string> = {}) {
    this.name = name
    this.tags = tags
    this.startTime = performance.now()
  }

  end(additionalTags?: Record<string, string>) {
    const duration = performance.now() - this.startTime

    trackMetric({
      name: this.name,
      value: duration,
      unit: 'ms',
      tags: { ...this.tags, ...additionalTags },
    })

    return duration
  }

  lap(lapName: string): number {
    const duration = performance.now() - this.startTime

    trackMetric({
      name: `${this.name}.${lapName}`,
      value: duration,
      unit: 'ms',
      tags: this.tags,
    })

    return duration
  }
}

/**
 * Track Web Vitals (Core Web Vitals for SEO)
 */
export function trackWebVital(metric: {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
}) {
  // Send to Sentry
  trackMetric({
    name: `web_vitals.${metric.name}`,
    value: metric.value,
    unit: 'ms',
    tags: {
      rating: metric.rating,
      id: metric.id,
    },
  })

  // Also send to analytics if available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    })
  }
}

/**
 * Track page load performance
 */
export function trackPageLoad(url: string) {
  if (typeof window === 'undefined') return

  // Wait for page to fully load
  window.addEventListener('load', () => {
    const perfData = window.performance.timing
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
    const connectTime = perfData.responseEnd - perfData.requestStart
    const renderTime = perfData.domComplete - perfData.domLoading

    trackMetric({
      name: 'page.load_time',
      value: pageLoadTime,
      unit: 'ms',
      tags: { url },
    })

    trackMetric({
      name: 'page.connect_time',
      value: connectTime,
      unit: 'ms',
      tags: { url },
    })

    trackMetric({
      name: 'page.render_time',
      value: renderTime,
      unit: 'ms',
      tags: { url },
    })
  })
}

/**
 * Track resource loading (scripts, stylesheets, images)
 */
export function trackResourceLoading() {
  if (typeof window === 'undefined') return

  window.addEventListener('load', () => {
    const resources = performance.getEntriesByType('resource')

    resources.forEach((resource: any) => {
      const { name, duration, initiatorType, transferSize } = resource

      trackMetric({
        name: 'resource.load_time',
        value: duration,
        unit: 'ms',
        tags: {
          type: initiatorType,
          url: new URL(name).pathname,
        },
      })

      if (transferSize) {
        trackMetric({
          name: 'resource.size',
          value: transferSize,
          unit: 'bytes',
          tags: {
            type: initiatorType,
          },
        })
      }
    })
  })
}

/**
 * Monitor memory usage (if available)
 */
export function trackMemoryUsage() {
  if (typeof window === 'undefined') return

  const memory = (performance as any).memory
  if (memory) {
    trackMetric({
      name: 'memory.used',
      value: memory.usedJSHeapSize,
      unit: 'bytes',
    })

    trackMetric({
      name: 'memory.limit',
      value: memory.jsHeapSizeLimit,
      unit: 'bytes',
    })

    // Alert if memory usage is high (>80%)
    const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    if (usagePercent > 80) {
      Sentry.captureMessage(`High memory usage: ${usagePercent.toFixed(1)}%`, {
        level: 'warning',
        extra: {
          used: memory.usedJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        },
      })
    }
  }
}

/**
 * Create a Sentry transaction for tracing
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
  })
}

/**
 * Middleware wrapper for API routes with performance tracking
 */
export function withPerformanceTracking<T>(
  handler: (req: any, res: any) => Promise<T>,
  operationName: string
) {
  return async (req: any, res: any): Promise<T> => {
    const transaction = startTransaction(operationName, 'http.server')
    const start = performance.now()

    try {
      const result = await handler(req, res)
      const duration = performance.now() - start

      trackAPICall(req.url, req.method, duration, res.statusCode || 200)

      transaction.setStatus('ok')
      transaction.finish()

      return result
    } catch (error) {
      const duration = performance.now() - start

      trackAPICall(req.url, req.method, duration, res.statusCode || 500)

      transaction.setStatus('internal_error')
      transaction.finish()

      throw error
    }
  }
}
