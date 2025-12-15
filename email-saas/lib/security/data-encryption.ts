// Data Encryption and Hashing
// Encrypt sensitive data at rest and hash passwords securely

import bcrypt from 'bcryptjs'

/**
 * Password Hashing Configuration
 */
const BCRYPT_COST = 12 // Cost factor for bcrypt (2^12 iterations)

/**
 * Hash a password using bcrypt
 * Cost factor: 12 (recommended for production)
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(BCRYPT_COST)
    const hash = await bcrypt.hash(password, salt)
    return hash
  } catch (error) {
    throw new Error('Failed to hash password')
  }
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    return false
  }
}

/**
 * AES-256-GCM Encryption for sensitive data
 */

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (256 bits)')
  }
  return key
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}

/**
 * Convert Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Encrypt data using AES-256-GCM
 * Returns: iv:ciphertext:authTag (all hex encoded)
 */
export async function encryptData(plaintext: string): Promise<string> {
  try {
    const key = getEncryptionKey()
    const keyBytes = hexToBytes(key)

    // Generate random IV (12 bytes for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Import key for Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )

    // Encrypt
    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128, // 128-bit auth tag
      },
      cryptoKey,
      data
    )

    // Combine IV + ciphertext (ciphertext includes auth tag)
    const ciphertextBytes = new Uint8Array(ciphertext)

    // Return as hex: iv:ciphertext
    return `${bytesToHex(iv)}:${bytesToHex(ciphertextBytes)}`
  } catch (error) {
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt data using AES-256-GCM
 * Input format: iv:ciphertext (hex encoded)
 */
export async function decryptData(encrypted: string): Promise<string> {
  try {
    const key = getEncryptionKey()
    const keyBytes = hexToBytes(key)

    // Split IV and ciphertext
    const parts = encrypted.split(':')
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format')
    }

    const iv = hexToBytes(parts[0])
    const ciphertext = hexToBytes(parts[1])

    // Import key for Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )

    // Decrypt
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128,
      },
      cryptoKey,
      ciphertext
    )

    const decoder = new TextDecoder()
    return decoder.decode(plaintext)
  } catch (error) {
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Encrypt sensitive fields in an object
 */
export async function encryptFields<T extends Record<string, any>>(
  data: T,
  fieldsToEncrypt: (keyof T)[]
): Promise<T> {
  const encrypted = { ...data }

  for (const field of fieldsToEncrypt) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = await encryptData(encrypted[field] as string)
    }
  }

  return encrypted
}

/**
 * Decrypt sensitive fields in an object
 */
export async function decryptFields<T extends Record<string, any>>(
  data: T,
  fieldsToDecrypt: (keyof T)[]
): Promise<T> {
  const decrypted = { ...data }

  for (const field of fieldsToDecrypt) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      try {
        decrypted[field] = await decryptData(decrypted[field] as string)
      } catch (error) {
        // If decryption fails, leave as is (might not be encrypted)
        console.error(`Failed to decrypt field: ${String(field)}`)
      }
    }
  }

  return decrypted
}

/**
 * Generate a new encryption key (for setup)
 * Run this once and store in environment variables
 */
export function generateEncryptionKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32)) // 256 bits
  return bytesToHex(bytes)
}

/**
 * Validate environment variables for security
 */
export function validateSecurityEnvironment(): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check encryption key
  const encryptionKey = process.env.ENCRYPTION_KEY
  if (!encryptionKey) {
    errors.push('ENCRYPTION_KEY is not set')
  } else if (encryptionKey.length !== 64) {
    errors.push('ENCRYPTION_KEY must be 64 characters (256 bits)')
  } else if (!/^[0-9a-f]+$/i.test(encryptionKey)) {
    errors.push('ENCRYPTION_KEY must be a valid hex string')
  }

  // Check database SSL
  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl && process.env.NODE_ENV === 'production') {
    if (!databaseUrl.includes('sslmode=require')) {
      warnings.push('DATABASE_URL should include sslmode=require in production')
    }
  }

  // Check Supabase URL (should be HTTPS)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    warnings.push('NEXT_PUBLIC_SUPABASE_URL should use HTTPS')
  }

  // Check for common security misconfigurations
  if (process.env.NODE_ENV === 'production') {
    // Check if using default/weak secrets
    const secrets = [
      'NEXTAUTH_SECRET',
      'JWT_SECRET',
      'API_SECRET',
    ]

    for (const secret of secrets) {
      const value = process.env[secret]
      if (value && (value.length < 32 || value === 'change-me' || value === 'secret')) {
        errors.push(`${secret} is too weak or using default value`)
      }
    }

    // Warn about development settings in production
    if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
      errors.push('NODE_TLS_REJECT_UNAUTHORIZED=0 is dangerous in production')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Hash sensitive data for lookups (one-way)
 * Use this for data you need to search but not decrypt (like email for deduplication)
 */
export async function hashForLookup(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataBytes = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes)
  const hashArray = new Uint8Array(hashBuffer)
  return bytesToHex(hashArray)
}

/**
 * Example: Encrypt API keys before storing in database
 */
export async function encryptApiKey(apiKey: string): Promise<{
  encrypted: string
  hint: string
}> {
  const encrypted = await encryptData(apiKey)
  // Store a hint (last 4 characters) for user reference
  const hint = apiKey.slice(-4)
  return { encrypted, hint }
}

/**
 * Example: Decrypt API key when needed
 */
export async function decryptApiKey(encrypted: string): Promise<string> {
  return await decryptData(encrypted)
}
