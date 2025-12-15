// Password Strength Validation
// Enforce strong password requirements

export interface PasswordStrengthResult {
  isValid: boolean
  score: number // 0-100
  feedback: string[]
  requirements: {
    minLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumber: boolean
    hasSpecialChar: boolean
    notCommon: boolean
  }
}

// Common weak passwords to reject
const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  '123456',
  '12345678',
  'qwerty',
  'abc123',
  'letmein',
  'welcome',
  'admin',
  'admin123',
  'password1',
  '123456789',
  '1234567890',
  'iloveyou',
  'sunshine',
  'princess',
  'monkey',
  'dragon',
  'master',
  'superman',
])

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = []
  let score = 0

  // Check minimum length (12 characters)
  const minLength = password.length >= 12
  if (minLength) {
    score += 20
  } else {
    feedback.push('Password must be at least 12 characters long')
  }

  // Check for uppercase letters
  const hasUppercase = /[A-Z]/.test(password)
  if (hasUppercase) {
    score += 20
  } else {
    feedback.push('Password must contain at least one uppercase letter')
  }

  // Check for lowercase letters
  const hasLowercase = /[a-z]/.test(password)
  if (hasLowercase) {
    score += 20
  } else {
    feedback.push('Password must contain at least one lowercase letter')
  }

  // Check for numbers
  const hasNumber = /[0-9]/.test(password)
  if (hasNumber) {
    score += 20
  } else {
    feedback.push('Password must contain at least one number')
  }

  // Check for special characters
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  if (hasSpecialChar) {
    score += 20
  } else {
    feedback.push('Password must contain at least one special character (!@#$%^&*)')
  }

  // Check against common passwords
  const notCommon = !COMMON_PASSWORDS.has(password.toLowerCase())
  if (!notCommon) {
    feedback.push('This password is too common. Please choose a more unique password.')
    score = Math.min(score, 30) // Cap score at 30 for common passwords
  }

  // Additional bonus points
  if (password.length >= 16) {
    score += 5
  }
  if (password.length >= 20) {
    score += 5
  }

  const isValid =
    minLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecialChar &&
    notCommon

  return {
    isValid,
    score: Math.min(score, 100),
    feedback,
    requirements: {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      notCommon,
    },
  }
}

/**
 * Generate password strength label
 */
export function getPasswordStrengthLabel(score: number): {
  label: string
  color: string
} {
  if (score >= 90) {
    return { label: 'Very Strong', color: 'green' }
  } else if (score >= 70) {
    return { label: 'Strong', color: 'teal' }
  } else if (score >= 50) {
    return { label: 'Moderate', color: 'yellow' }
  } else if (score >= 30) {
    return { label: 'Weak', color: 'orange' }
  } else {
    return { label: 'Very Weak', color: 'red' }
  }
}

/**
 * Check if password has been breached (using Have I Been Pwned API)
 * Note: This uses k-anonymity - only sends first 5 chars of SHA-1 hash
 */
export async function checkPasswordBreach(password: string): Promise<{
  isBreached: boolean
  count?: number
}> {
  try {
    // Hash password with SHA-1
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    const hash = hashHex.toUpperCase()

    // Send only first 5 characters to API (k-anonymity)
    const prefix = hash.substring(0, 5)
    const suffix = hash.substring(5)

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`)
    const text = await response.text()

    // Check if our hash suffix is in the response
    const lines = text.split('\n')
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':')
      if (hashSuffix === suffix) {
        return {
          isBreached: true,
          count: parseInt(count, 10),
        }
      }
    }

    return { isBreached: false }
  } catch (error) {
    // If API fails, don't block the user
    console.error('Failed to check password breach:', error)
    return { isBreached: false }
  }
}

/**
 * Validate password matches confirmation
 */
export function validatePasswordMatch(
  password: string,
  confirmation: string
): { isValid: boolean; error?: string } {
  if (password !== confirmation) {
    return {
      isValid: false,
      error: 'Passwords do not match',
    }
  }
  return { isValid: true }
}

/**
 * Check if password is similar to user info (email, name)
 */
export function checkPasswordSimilarity(
  password: string,
  userInfo: { email?: string; name?: string }
): { isSimilar: boolean; feedback?: string } {
  const passwordLower = password.toLowerCase()

  // Check against email
  if (userInfo.email) {
    const emailParts = userInfo.email.toLowerCase().split('@')[0]
    if (
      passwordLower.includes(emailParts) ||
      emailParts.includes(passwordLower)
    ) {
      return {
        isSimilar: true,
        feedback: 'Password should not contain your email address',
      }
    }
  }

  // Check against name
  if (userInfo.name) {
    const nameParts = userInfo.name.toLowerCase().split(' ')
    for (const part of nameParts) {
      if (
        part.length > 3 &&
        (passwordLower.includes(part) || part.includes(passwordLower))
      ) {
        return {
          isSimilar: true,
          feedback: 'Password should not contain your name',
        }
      }
    }
  }

  return { isSimilar: false }
}
