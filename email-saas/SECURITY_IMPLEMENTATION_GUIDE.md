# Security Implementation Guide

This guide covers all security features implemented in the email SaaS application, including authentication, API security, data protection, and GDPR compliance.

## Table of Contents

1. [Authentication Security](#authentication-security)
2. [API Security](#api-security)
3. [Data Security](#data-security)
4. [GDPR Compliance](#gdpr-compliance)
5. [Security Middleware](#security-middleware)
6. [Security Dashboard](#security-dashboard)
7. [Environment Setup](#environment-setup)
8. [Best Practices](#best-practices)

---

## Authentication Security

### Password Validation

**Location:** [lib/security/password-validation.ts](lib/security/password-validation.ts)

**Features:**
- Minimum 12 characters
- Requires: uppercase, lowercase, number, special character
- Blocks common passwords (password, 123456, etc.)
- Checks against Have I Been Pwned breach database
- Validates similarity to user info (email, name)
- Returns strength score (0-100) with feedback

**Usage:**
```typescript
import { validatePasswordStrength, checkPasswordBreach } from '@/lib/security/password-validation'

// Validate password strength
const result = validatePasswordStrength('MyP@ssw0rd123!')
console.log(result.score) // 0-100
console.log(result.feedback) // Array of feedback messages
console.log(result.meetsRequirements) // true/false

// Check if password was breached
const breachCheck = await checkPasswordBreach('password123')
if (breachCheck.isBreached) {
  console.log(`Found in ${breachCheck.count} breaches`)
}
```

---

### Session Management

**Location:** [lib/security/session-management.ts](lib/security/session-management.ts)

**Features:**
- 30-minute inactivity timeout
- 7-day maximum session duration
- Secure cookie settings (httpOnly, secure in production, sameSite: 'lax')
- Activity tracking
- Session revocation
- Multi-device session management

**Usage:**
```typescript
import {
  isSessionValid,
  refreshSession,
  invalidateSession,
  getSecureCookieOptions,
} from '@/lib/security/session-management'

// Check if session is valid
const valid = await isSessionValid()

// Refresh session on activity
await refreshSession()

// Logout
await invalidateSession()

// Get secure cookie options
const cookieOptions = getSecureCookieOptions()
```

**Database Schema:**
```sql
-- See database/migrations/security-tables.sql
-- user_sessions table tracks all active sessions
```

---

## API Security

### CORS Configuration

**Location:** [lib/security/cors-csrf.ts](lib/security/cors-csrf.ts:9-36)

**Allowed Origins:**
- Production: Your production domain(s)
- Development: localhost:3000, 127.0.0.1:3000

**Usage:**
```typescript
import { handleCORSPreflight, addCORSHeaders } from '@/lib/security/cors-csrf'

// In API route
if (request.method === 'OPTIONS') {
  return handleCORSPreflight(request)
}

const response = NextResponse.json({ data })
return addCORSHeaders(response, request)
```

---

### CSRF Protection

**Location:** [lib/security/cors-csrf.ts](lib/security/cors-csrf.ts:86-157)

**Features:**
- CSRF token generation (32-byte random)
- Constant-time comparison (prevents timing attacks)
- Automatic validation for POST/PUT/PATCH/DELETE requests
- Origin header validation

**Usage:**
```typescript
import { generateCSRFToken, validateCSRFProtection } from '@/lib/security/cors-csrf'

// Generate token for forms
const token = generateCSRFToken()

// Validate in middleware
const result = await validateCSRFProtection(request)
if (!result.isValid) {
  return NextResponse.json({ error: result.error }, { status: 403 })
}
```

---

### Input Sanitization

**Location:** [lib/security/input-sanitization.ts](lib/security/input-sanitization.ts)

**Features:**
- XSS prevention (HTML escaping)
- SQL injection prevention (UUID validation)
- URL sanitization (blocks javascript:, data: protocols)
- Filename sanitization (prevents directory traversal)
- Query parameter validation
- Deep object sanitization

**Usage:**
```typescript
import {
  sanitizeHtml,
  sanitizeUrl,
  sanitizeFilename,
  isValidUuid,
  deepSanitize,
} from '@/lib/security/input-sanitization'

// Sanitize user input
const safe = sanitizeHtml(userInput)

// Validate URL
const safeUrl = sanitizeUrl(untrustedUrl)

// Validate UUID before database query
if (!isValidUuid(id)) {
  throw new Error('Invalid ID')
}

// Deep sanitize object
const safeData = deepSanitize(requestBody)
```

---

### Rate Limiting

**Location:** [middleware/security.ts](middleware/security.ts:15-54)

**Rate Limits:**
- General API: 100 requests/minute
- Auth endpoints: 5 attempts/minute
- Email sending: 50/hour
- Data exports: 2/day

**Usage:**
```typescript
import { withRateLimit } from '@/middleware/security'

// Wrap API route handler
export const POST = withRateLimit(handler, 10, '1 m') // 10 requests per minute
```

**Requirements:**
```env
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

---

## Data Security

### Encryption (AES-256-GCM)

**Location:** [lib/security/data-encryption.ts](lib/security/data-encryption.ts:45-119)

**Features:**
- AES-256-GCM encryption
- Random IV generation
- Authenticated encryption
- Field-level encryption

**Setup:**
```bash
# Generate encryption key (run once)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Usage:**
```typescript
import {
  encryptData,
  decryptData,
  encryptFields,
  decryptFields,
} from '@/lib/security/data-encryption'

// Encrypt sensitive data
const encrypted = await encryptData('sensitive-data')

// Decrypt
const decrypted = await decryptData(encrypted)

// Encrypt specific fields in object
const user = {
  name: 'John',
  apiKey: 'secret-key',
  email: 'john@example.com',
}
const encrypted = await encryptFields(user, ['apiKey'])
```

**Environment:**
```env
ENCRYPTION_KEY=64-character-hex-string
```

---

### Password Hashing

**Location:** [lib/security/data-encryption.ts](lib/security/data-encryption.ts:8-28)

**Features:**
- bcrypt with cost factor 12 (2^12 iterations)
- Constant-time comparison

**Usage:**
```typescript
import { hashPassword, verifyPassword } from '@/lib/security/data-encryption'

// Hash password
const hash = await hashPassword('user-password')

// Verify password
const isValid = await verifyPassword('user-password', hash)
```

**Installation:**
```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

---

### Environment Validation

**Location:** [lib/security/data-encryption.ts](lib/security/data-encryption.ts:146-205)

**Usage:**
```typescript
import { validateSecurityEnvironment } from '@/lib/security/data-encryption'

const validation = validateSecurityEnvironment()
if (!validation.isValid) {
  console.error('Security errors:', validation.errors)
}
console.warn('Security warnings:', validation.warnings)
```

---

## GDPR Compliance

### Data Export (Article 20)

**Location:** [lib/security/gdpr-compliance.ts](lib/security/gdpr-compliance.ts:40-95)

**API Endpoint:** `POST /api/user/export`

**Features:**
- Exports all user data in JSON format
- Machine-readable format
- Includes: profile, email accounts, campaigns, sends, consents, audit logs
- Rate limited: 2 exports per day

**Usage:**
```typescript
import { exportUserData } from '@/lib/security/gdpr-compliance'

const data = await exportUserData(userId)
// Returns UserDataExport object with all user data
```

**API Example:**
```bash
curl -X POST https://yourapp.com/api/user/export \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Right to Deletion (Article 17)

**Location:** [lib/security/gdpr-compliance.ts](lib/security/gdpr-compliance.ts:97-176)

**API Endpoint:** `DELETE /api/user/delete`

**Features:**
- Deletes all user data
- Requires password confirmation
- Logs deletion audit trail
- Returns count of deleted records
- Cascading deletion across all tables

**Usage:**
```typescript
import { deleteUserData } from '@/lib/security/gdpr-compliance'

const result = await deleteUserData(userId, 'User requested deletion')
console.log(result.deletedRecords)
```

**API Example:**
```bash
curl -X DELETE https://yourapp.com/api/user/delete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password": "user-password", "reason": "No longer need account"}'
```

---

### Consent Management

**Location:** [lib/security/gdpr-compliance.ts](lib/security/gdpr-compliance.ts:178-231)

**API Endpoint:** `GET/POST/DELETE /api/user/consent`

**Consent Types:**
- `necessary` - Required for service (cannot be revoked)
- `marketing_emails` - Marketing communications
- `analytics` - Usage analytics
- `personalization` - Personalized features
- `third_party_sharing` - Data sharing with third parties

**Usage:**
```typescript
import {
  recordConsent,
  hasConsent,
  revokeConsent,
  ConsentType,
} from '@/lib/security/gdpr-compliance'

// Record consent
await recordConsent(userId, ConsentType.MARKETING_EMAILS, true, {
  ip_address: '1.2.3.4',
  user_agent: 'Mozilla/5.0...',
  privacy_policy_version: '1.0.0',
})

// Check consent
const canSendMarketing = await hasConsent(userId, ConsentType.MARKETING_EMAILS)

// Revoke consent
await revokeConsent(userId, ConsentType.MARKETING_EMAILS, {
  ip_address: '1.2.3.4',
  user_agent: 'Mozilla/5.0...',
})
```

---

### Privacy Policy Enforcement

**Location:** [lib/security/gdpr-compliance.ts](lib/security/gdpr-compliance.ts:247-284)

**Usage:**
```typescript
import {
  hasAcceptedPrivacyPolicy,
  requirePrivacyPolicyAcceptance,
} from '@/lib/security/gdpr-compliance'

// Check if user accepted current version
const accepted = await hasAcceptedPrivacyPolicy(userId)

// Require acceptance
const status = await requirePrivacyPolicyAcceptance(userId)
if (!status.accepted) {
  // Show privacy policy modal
  console.log(`Current version: ${status.currentVersion}`)
  console.log(`User accepted: ${status.userVersion}`)
}
```

**Environment:**
```env
PRIVACY_POLICY_VERSION=1.0.0
```

---

### Data Anonymization

**Location:** [lib/security/gdpr-compliance.ts](lib/security/gdpr-compliance.ts:299-340)

**Features:**
- Alternative to deletion
- Removes PII while keeping analytics
- Generates anonymous ID

**Usage:**
```typescript
import { anonymizeUserData } from '@/lib/security/gdpr-compliance'

const result = await anonymizeUserData(userId)
```

---

### Data Retention

**Location:** [lib/security/gdpr-compliance.ts](lib/security/gdpr-compliance.ts:342-372)

**Retention Rules:**
- Email sends: 1 year
- Audit logs: 2 years

**Usage:**
```typescript
import { enforceDataRetention } from '@/lib/security/gdpr-compliance'

// Run via cron job
const result = await enforceDataRetention()
console.log(result.deleted)
```

---

## Security Middleware

**Location:** [middleware/security.ts](middleware/security.ts)

### Features

1. **CORS Handling**
2. **Rate Limiting** (per endpoint)
3. **CSRF Validation**
4. **Session Validation**
5. **Security Headers**
6. **Security Event Logging**

### Usage

**In middleware.ts:**
```typescript
import { securityMiddleware, securityMiddlewareConfig } from './middleware/security'

export const middleware = securityMiddleware
export const config = securityMiddlewareConfig
```

**Protected Routes:**
```typescript
import { protectedRoute } from '@/middleware/security'

export async function GET(request: NextRequest) {
  return protectedRoute(request, async (req) => {
    // Your handler
    return NextResponse.json({ data })
  })
}
```

**Admin Routes:**
```typescript
import { adminRoute } from '@/middleware/security'

export async function GET(request: NextRequest) {
  return adminRoute(request, async (req) => {
    // Admin-only handler
    return NextResponse.json({ data })
  })
}
```

---

## Security Dashboard

### API Endpoints

1. **Audit Logs:** `GET /api/security/audit-logs`
   - View user activity logs
   - Filter by event type
   - Pagination support

2. **Sessions:** `GET /api/security/sessions`
   - View active sessions
   - Revoke sessions
   - Multi-device management

3. **Security Events:** `GET /api/security/events` (Admin only)
   - View security events
   - Filter by severity
   - Resolve events

### Usage Examples

```bash
# Get audit logs
curl https://yourapp.com/api/security/audit-logs?limit=50

# Get active sessions
curl https://yourapp.com/api/security/sessions

# Revoke all sessions
curl -X DELETE "https://yourapp.com/api/security/sessions?revoke_all=true"

# Get security events (admin)
curl https://yourapp.com/api/security/events?severity=high
```

---

## Environment Setup

### Required Environment Variables

```env
# Encryption (required)
ENCRYPTION_KEY=64-character-hex-string-generated-with-crypto-randomBytes

# Rate Limiting (required)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# GDPR Compliance
PRIVACY_POLICY_VERSION=1.0.0

# Security
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://yourapp.com

# Database (ensure SSL in production)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Generate Encryption Key

```bash
# Generate a new 256-bit encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Validate Environment

```typescript
import { validateSecurityEnvironment } from '@/lib/security/data-encryption'

const result = validateSecurityEnvironment()
if (!result.isValid) {
  console.error('Errors:', result.errors)
  process.exit(1)
}
if (result.warnings.length > 0) {
  console.warn('Warnings:', result.warnings)
}
```

---

## Best Practices

### 1. Password Security

✅ **Do:**
- Use bcrypt with cost 12+
- Enforce strong password requirements
- Check against breach databases
- Prevent password reuse

❌ **Don't:**
- Store passwords in plaintext
- Use weak hashing (MD5, SHA-1)
- Allow common passwords
- Skip strength validation

---

### 2. Session Security

✅ **Do:**
- Use secure, httpOnly cookies
- Implement session timeout
- Refresh session on activity
- Allow users to revoke sessions

❌ **Don't:**
- Store sessions in localStorage
- Use predictable session IDs
- Allow infinite sessions
- Skip session validation

---

### 3. API Security

✅ **Do:**
- Implement rate limiting
- Validate all inputs
- Use CSRF tokens
- Configure CORS properly
- Add security headers

❌ **Don't:**
- Trust user input
- Skip input validation
- Allow unlimited requests
- Use permissive CORS (`*`)

---

### 4. Data Protection

✅ **Do:**
- Encrypt sensitive data at rest
- Use strong encryption (AES-256)
- Rotate encryption keys
- Use SSL/TLS for transit

❌ **Don't:**
- Store secrets in code
- Use weak encryption
- Hardcode keys
- Skip encryption

---

### 5. GDPR Compliance

✅ **Do:**
- Implement data export
- Allow data deletion
- Track consents
- Enforce privacy policy
- Keep audit logs

❌ **Don't:**
- Ignore user requests
- Store data indefinitely
- Skip consent tracking
- Make deletion difficult

---

### 6. Security Monitoring

✅ **Do:**
- Log security events
- Monitor failed logins
- Track suspicious activity
- Set up alerts
- Review logs regularly

❌ **Don't:**
- Ignore security events
- Skip audit logging
- Disable monitoring
- Leave events unresolved

---

## Database Migrations

Run the security table migrations:

```bash
# Connect to your database
psql $DATABASE_URL

# Run migration
\i database/migrations/security-tables.sql
```

**Tables Created:**
- `user_consents` - GDPR consent tracking
- `audit_logs` - Security and user activity logs
- `user_sessions` - Active session management
- `failed_login_attempts` - Brute force protection
- `security_events` - Security incident tracking

---

## Security Checklist

### Before Production

- [ ] Generate strong `ENCRYPTION_KEY`
- [ ] Configure Upstash Redis for rate limiting
- [ ] Set `PRIVACY_POLICY_VERSION`
- [ ] Run database migrations
- [ ] Enable SSL for database connections
- [ ] Configure allowed CORS origins
- [ ] Test password validation
- [ ] Test session timeout
- [ ] Test rate limiting
- [ ] Test CSRF protection
- [ ] Test data export
- [ ] Test data deletion
- [ ] Verify security headers
- [ ] Review audit logging
- [ ] Set up security alerts

### Regular Maintenance

- [ ] Review audit logs weekly
- [ ] Check security events daily
- [ ] Rotate encryption keys quarterly
- [ ] Update dependencies monthly
- [ ] Run security scans
- [ ] Review failed login attempts
- [ ] Clean up old sessions
- [ ] Enforce data retention policies

---

## Support

For security issues or questions:
1. Check this documentation
2. Review code comments in security modules
3. Test in development environment first
4. Report security vulnerabilities privately

**Never commit secrets to git!**
