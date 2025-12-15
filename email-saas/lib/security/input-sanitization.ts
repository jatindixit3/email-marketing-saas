// Input Sanitization
// Prevent XSS, SQL injection, and other injection attacks

/**
 * Sanitize HTML content (prevent XSS)
 */
export function sanitizeHtml(input: string): string {
  if (!input) return ''

  // Replace HTML special characters
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize string for database (trim, normalize)
 */
export function sanitizeString(input: string): string {
  if (!input) return ''

  return input.trim().replace(/\s+/g, ' ')
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ''

  return email.toLowerCase().trim()
}

/**
 * Sanitize URL (prevent javascript: and data: URLs)
 */
export function sanitizeUrl(url: string): string {
  if (!url) return ''

  const trimmedUrl = url.trim().toLowerCase()

  // Block dangerous protocols
  if (
    trimmedUrl.startsWith('javascript:') ||
    trimmedUrl.startsWith('data:') ||
    trimmedUrl.startsWith('vbscript:') ||
    trimmedUrl.startsWith('file:')
  ) {
    return ''
  }

  // Ensure URL starts with http:// or https://
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    return `https://${trimmedUrl}`
  }

  return url.trim()
}

/**
 * Sanitize filename (prevent directory traversal)
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return ''

  // Remove path separators and special characters
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.\.+/g, '_')
    .replace(/^\./, '_')
}

/**
 * Sanitize JSON input
 */
export function sanitizeJson(input: any): any {
  if (typeof input === 'string') {
    return sanitizeHtml(input)
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeJson)
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const key in input) {
      sanitized[sanitizeString(key)] = sanitizeJson(input[key])
    }
    return sanitized
  }

  return input
}

/**
 * Validate and sanitize query parameters
 */
export function sanitizeQueryParams(
  params: Record<string, any>
): Record<string, string> {
  const sanitized: Record<string, string> = {}

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      sanitized[sanitizeString(key)] = sanitizeString(value)
    } else if (typeof value === 'number') {
      sanitized[sanitizeString(key)] = value.toString()
    } else if (typeof value === 'boolean') {
      sanitized[sanitizeString(key)] = value.toString()
    }
  }

  return sanitized
}

/**
 * Prevent SQL injection (for raw queries - Prisma/Supabase already handle this)
 */
export function escapeSql(input: string): string {
  if (!input) return ''

  return input.replace(/'/g, "''").replace(/;/g, '')
}

/**
 * Sanitize phone number
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return ''

  // Remove all non-digit characters except +
  return phone.replace(/[^\d+]/g, '')
}

/**
 * Sanitize credit card number (for display - never store unencrypted)
 */
export function sanitizeCreditCard(cardNumber: string): string {
  if (!cardNumber) return ''

  // Remove all non-digit characters
  const digits = cardNumber.replace(/\D/g, '')

  // Show only last 4 digits
  if (digits.length >= 4) {
    return `**** **** **** ${digits.slice(-4)}`
  }

  return '****'
}

/**
 * Validate and sanitize user input object
 */
export function sanitizeUserInput<T extends Record<string, any>>(
  input: T,
  allowedFields: (keyof T)[]
): Partial<T> {
  const sanitized: Partial<T> = {}

  for (const field of allowedFields) {
    if (input[field] !== undefined) {
      const value = input[field]

      if (typeof value === 'string') {
        sanitized[field] = sanitizeString(value) as T[keyof T]
      } else {
        sanitized[field] = value
      }
    }
  }

  return sanitized
}

/**
 * Remove null bytes (prevent null byte injection)
 */
export function removeNullBytes(input: string): string {
  if (!input) return ''

  return input.replace(/\0/g, '')
}

/**
 * Validate UUID format (prevent invalid UUIDs in queries)
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Sanitize search query (prevent injection in search)
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return ''

  // Remove SQL wildcards and special characters
  return query
    .replace(/[%_]/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 100) // Limit length
}

/**
 * Sanitize markdown input (allow safe markdown, remove scripts)
 */
export function sanitizeMarkdown(input: string): string {
  if (!input) return ''

  // Remove script tags and event handlers
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
}

/**
 * Deep sanitize object (recursive)
 */
export function deepSanitize(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map(deepSanitize)
  }

  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[sanitizeString(key)] = deepSanitize(obj[key])
      }
    }
    return sanitized
  }

  return obj
}

/**
 * Content Security Policy (CSP) header generator
 */
export function generateCSPHeader(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://api.sentry.io",
    "frame-src 'self' https://vercel.live",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ]

  return directives.join('; ')
}
