// Custom Validation System (No Zod - Native TypeScript + HTML5)

// Validation result type
export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

// Individual field validators
export const validators = {
  required: (value: any, fieldName: string): string | null => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} is required`
    }
    return null
  },

  email: (value: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address'
    }
    return null
  },

  minLength: (value: string, min: number, fieldName: string): string | null => {
    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters`
    }
    return null
  },

  maxLength: (value: string, max: number, fieldName: string): string | null => {
    if (value.length > max) {
      return `${fieldName} must be no more than ${max} characters`
    }
    return null
  },

  pattern: (value: string, pattern: RegExp, message: string): string | null => {
    if (!pattern.test(value)) {
      return message
    }
    return null
  },

  url: (value: string): string | null => {
    try {
      new URL(value)
      return null
    } catch {
      return 'Please enter a valid URL'
    }
  },

  match: (value: string, matchValue: string, fieldName: string): string | null => {
    if (value !== matchValue) {
      return `${fieldName} do not match`
    }
    return null
  },

  number: (value: any): string | null => {
    if (isNaN(Number(value))) {
      return 'Must be a valid number'
    }
    return null
  },

  positiveNumber: (value: number): string | null => {
    if (value <= 0) {
      return 'Must be a positive number'
    }
    return null
  },

  integer: (value: number): string | null => {
    if (!Number.isInteger(value)) {
      return 'Must be a whole number'
    }
    return null
  },
}

// Sanitization utilities (XSS prevention)
export const sanitize = {
  html: (input: string): string => {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  },

  email: (email: string): string => {
    return email.toLowerCase().trim()
  },

  string: (input: string): string => {
    return input.trim()
  },
}
