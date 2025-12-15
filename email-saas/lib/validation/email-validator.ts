// Advanced Email Validation with Disposable Email Detection

import dns from 'dns'
import { promisify } from 'util'

const resolveMx = promisify(dns.resolveMx)

// List of common disposable email domains
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'throwaway.email',
  'temp-mail.org',
  'fakeinbox.com',
  'maildrop.cc',
  'trashmail.com',
  'yopmail.com',
  'sharklasers.com',
  'guerrillamailblock.com',
  'grr.la',
  'pokemail.net',
  'spam4.me',
  'mintemail.com',
  'mytrashmail.com',
  'mailnesia.com',
  'trashmail.net',
  'emailondeck.com',
])

export interface EmailValidationResult {
  valid: boolean
  error?: string
  details?: {
    format: boolean
    disposable: boolean
    mxRecord?: boolean
  }
}

// Basic format validation
export function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Check if email is from disposable domain
export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false
}

// Verify MX records exist for domain (server-side only)
export async function verifyMxRecord(email: string): Promise<boolean> {
  const domain = email.split('@')[1]
  if (!domain) return false

  try {
    const addresses = await resolveMx(domain)
    return addresses && addresses.length > 0
  } catch (error) {
    return false
  }
}

// Comprehensive email validation
export async function validateEmail(
  email: string,
  options: {
    checkDisposable?: boolean
    checkMxRecord?: boolean
  } = {}
): Promise<EmailValidationResult> {
  const { checkDisposable = true, checkMxRecord = false } = options

  // Format check
  if (!validateEmailFormat(email)) {
    return {
      valid: false,
      error: 'Invalid email format',
      details: { format: false, disposable: false },
    }
  }

  // Disposable email check
  if (checkDisposable && isDisposableEmail(email)) {
    return {
      valid: false,
      error: 'Disposable email addresses are not allowed',
      details: { format: true, disposable: true },
    }
  }

  // MX record check (optional, server-side only)
  let mxValid = true
  if (checkMxRecord) {
    mxValid = await verifyMxRecord(email)
    if (!mxValid) {
      return {
        valid: false,
        error: 'Email domain does not exist',
        details: { format: true, disposable: false, mxRecord: false },
      }
    }
  }

  return {
    valid: true,
    details: {
      format: true,
      disposable: false,
      mxRecord: checkMxRecord ? mxValid : undefined,
    },
  }
}

// Bulk email validation (for CSV imports)
export async function validateEmailBatch(
  emails: string[]
): Promise<Map<string, EmailValidationResult>> {
  const results = new Map<string, EmailValidationResult>()

  for (const email of emails) {
    const result = await validateEmail(email, {
      checkDisposable: true,
      checkMxRecord: false, // Skip MX for bulk to avoid rate limits
    })
    results.set(email, result)
  }

  return results
}
