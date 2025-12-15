# Security Implementation Checklist

Use this checklist to ensure all security features are properly configured and tested.

## 🔐 Authentication Security

### Password Security
- [ ] Password strength validation enabled (12+ characters)
- [ ] Uppercase, lowercase, number, special character requirements enforced
- [ ] Common passwords blocked
- [ ] Have I Been Pwned integration configured
- [ ] Password similarity checking enabled
- [ ] Users receive clear feedback on password strength

**Test:**
```bash
# Try creating account with weak password - should fail
# Try password that's been breached - should warn/block
# Try strong password - should succeed
```

---

### Session Management
- [ ] Session timeout configured (30 minutes)
- [ ] Max session duration set (7 days)
- [ ] Secure cookie options enabled (httpOnly, secure, sameSite)
- [ ] Session activity tracking working
- [ ] Session revocation functional
- [ ] Multi-device session management tested

**Test:**
```bash
# Login and wait 30 minutes - session should expire
# Login on multiple devices - all sessions should show
# Revoke session from one device - should logout
```

---

### Rate Limiting
- [ ] Login attempts limited (5 per minute)
- [ ] Failed login tracking enabled
- [ ] Account lockout after too many failed attempts
- [ ] Rate limit feedback shown to users

**Test:**
```bash
# Try logging in 6 times in 1 minute - should block
# Wait 1 minute - should allow login again
```

---

## 🛡️ API Security

### CORS Configuration
- [ ] Production origins configured
- [ ] Development origins configured
- [ ] Allowed methods specified
- [ ] Allowed headers specified
- [ ] Credentials enabled for same-origin
- [ ] Preflight requests handled

**Environment Check:**
```env
NEXT_PUBLIC_SITE_URL=https://yourapp.com
```

**Test:**
```bash
# From different origin - should block
curl -X POST https://yourapp.com/api/test \
  -H "Origin: https://malicious.com" \
  -H "Content-Type: application/json"

# From allowed origin - should allow
curl -X POST https://yourapp.com/api/test \
  -H "Origin: https://yourapp.com" \
  -H "Content-Type: application/json"
```

---

### CSRF Protection
- [ ] CSRF tokens generated properly
- [ ] CSRF validation on POST/PUT/PATCH/DELETE
- [ ] Origin header validated
- [ ] Safe methods (GET, HEAD, OPTIONS) exempt
- [ ] Token included in forms/requests

**Test:**
```bash
# POST without CSRF token - should block
curl -X POST https://yourapp.com/api/data

# POST with valid token - should allow
curl -X POST https://yourapp.com/api/data \
  -H "X-CSRF-Token: valid-token"
```

---

### Input Sanitization
- [ ] HTML escaping working
- [ ] URL sanitization preventing javascript: and data: protocols
- [ ] Filename sanitization preventing directory traversal
- [ ] UUID validation before database queries
- [ ] Query parameter sanitization enabled
- [ ] JSON deep sanitization working

**Test:**
```typescript
// Try XSS - should be escaped
const input = '<script>alert("XSS")</script>'
const safe = sanitizeHtml(input)
// Result: &lt;script&gt;alert("XSS")&lt;/script&gt;

// Try SQL injection - should validate UUID
const maliciousId = "1'; DROP TABLE users; --"
isValidUuid(maliciousId) // false

// Try directory traversal
const maliciousFile = '../../../etc/passwd'
sanitizeFilename(maliciousFile) // _____etc_passwd
```

---

### Rate Limiting (API)
- [ ] General API limited (100 req/min)
- [ ] Auth endpoints limited (5 req/min)
- [ ] Email sending limited (50 req/hour)
- [ ] Data export limited (2 req/day)
- [ ] Rate limit headers included
- [ ] Retry-After header on 429

**Environment Check:**
```env
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

**Test:**
```bash
# Make 101 API requests in 1 minute - last should 429
for i in {1..101}; do
  curl https://yourapp.com/api/test
done
```

---

### Security Headers
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Permissions-Policy configured
- [ ] Strict-Transport-Security (production only)
- [ ] Content-Security-Policy configured

**Test:**
```bash
# Check headers
curl -I https://yourapp.com | grep -i "x-frame-options"
curl -I https://yourapp.com | grep -i "content-security-policy"
```

---

## 🔒 Data Security

### Encryption
- [ ] Encryption key generated (256-bit)
- [ ] Key stored in environment (not code)
- [ ] AES-256-GCM encryption working
- [ ] IV generated randomly for each encryption
- [ ] Encrypted data format: iv:ciphertext
- [ ] Decryption working properly

**Setup:**
```bash
# Generate key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
ENCRYPTION_KEY=<generated-key>
```

**Test:**
```typescript
const encrypted = await encryptData('sensitive')
const decrypted = await decryptData(encrypted)
// decrypted === 'sensitive'
```

---

### Password Hashing
- [ ] bcrypt cost factor 12
- [ ] Password hashing on signup
- [ ] Password verification on login
- [ ] Constant-time comparison
- [ ] Old password hashes still work (no breaking changes)

**Test:**
```typescript
const hash = await hashPassword('MyPassword123!')
const valid = await verifyPassword('MyPassword123!', hash) // true
const invalid = await verifyPassword('wrong', hash) // false
```

---

### Environment Security
- [ ] Encryption key validated (64 chars hex)
- [ ] Database SSL enabled in production
- [ ] Supabase URL uses HTTPS
- [ ] No default/weak secrets
- [ ] NODE_TLS_REJECT_UNAUTHORIZED not disabled
- [ ] No secrets in git/code

**Test:**
```typescript
const validation = validateSecurityEnvironment()
console.log(validation.errors) // Should be empty
console.log(validation.warnings) // Review warnings
```

---

## 📋 GDPR Compliance

### Data Export
- [ ] Export API endpoint working (`POST /api/user/export`)
- [ ] All user data included
- [ ] Machine-readable format (JSON)
- [ ] Rate limited (2 per day)
- [ ] Export logged in audit trail
- [ ] Password confirmation required

**Test:**
```bash
curl -X POST https://yourapp.com/api/user/export \
  -H "Authorization: Bearer TOKEN" \
  -o user-data.json

# Verify all data included
cat user-data.json | jq '.user, .profile, .email_accounts'
```

---

### Right to Deletion
- [ ] Delete API endpoint working (`DELETE /api/user/delete`)
- [ ] Password confirmation required
- [ ] All user data deleted
- [ ] Cascading deletion working
- [ ] Deletion logged before completion
- [ ] User signed out after deletion
- [ ] Count of deleted records returned

**Test:**
```bash
curl -X DELETE https://yourapp.com/api/user/delete \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password": "user-password", "reason": "Test deletion"}'
```

---

### Consent Tracking
- [ ] Consent recording working
- [ ] All consent types defined
- [ ] IP address and user agent logged
- [ ] Privacy policy version tracked
- [ ] Consent retrieval working
- [ ] Consent revocation working
- [ ] Necessary consent cannot be revoked

**Consent Types:**
- [ ] `necessary` - Required
- [ ] `marketing_emails` - Marketing
- [ ] `analytics` - Analytics
- [ ] `personalization` - Features
- [ ] `third_party_sharing` - Sharing

**Test:**
```bash
# Grant consent
curl -X POST https://yourapp.com/api/user/consent \
  -H "Authorization: Bearer TOKEN" \
  -d '{"consentType": "marketing_emails", "granted": true}'

# Check consent
curl https://yourapp.com/api/user/consent

# Revoke consent
curl -X DELETE "https://yourapp.com/api/user/consent?type=marketing_emails"
```

---

### Privacy Policy
- [ ] Privacy policy version configured
- [ ] Version acceptance tracked
- [ ] Users required to accept on signup
- [ ] Users required to accept on version change
- [ ] Acceptance date/version stored

**Environment:**
```env
PRIVACY_POLICY_VERSION=1.0.0
```

**Test:**
```typescript
const status = await requirePrivacyPolicyAcceptance(userId)
if (!status.accepted) {
  // Show privacy policy modal
}
```

---

## 🛠️ Security Middleware

### Middleware Configuration
- [ ] Security middleware enabled globally
- [ ] Matcher configured correctly
- [ ] CORS handled
- [ ] Rate limiting applied
- [ ] CSRF validation working
- [ ] Session validation working
- [ ] Security headers added
- [ ] Events logged

**Check middleware.ts:**
```typescript
export { securityMiddleware as middleware } from './middleware/security'
export { securityMiddlewareConfig as config } from './middleware/security'
```

---

### Protected Routes
- [ ] Protected routes require authentication
- [ ] Unauthenticated users get 401
- [ ] Invalid sessions rejected
- [ ] Session info available in handler

**Test:**
```bash
# Without auth - should 401
curl https://yourapp.com/api/protected

# With auth - should work
curl https://yourapp.com/api/protected \
  -H "Authorization: Bearer TOKEN"
```

---

### Admin Routes
- [ ] Admin routes check role
- [ ] Non-admins get 403
- [ ] Unauthorized access logged
- [ ] Admin access logged

**Test:**
```bash
# Regular user - should 403
curl https://yourapp.com/api/admin/users

# Admin user - should work
curl https://yourapp.com/api/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 📊 Security Dashboard

### Audit Logs
- [ ] Audit log API working (`GET /api/security/audit-logs`)
- [ ] Events properly logged
- [ ] Pagination working
- [ ] Event type filtering working
- [ ] Users can only see their own logs

**Events to Track:**
- [ ] Login success/failure
- [ ] Logout
- [ ] Password change
- [ ] Email change
- [ ] Data export
- [ ] Data deletion
- [ ] Consent changes
- [ ] Session revocation

**Test:**
```bash
curl https://yourapp.com/api/security/audit-logs?limit=50
```

---

### Session Management
- [ ] Session list API working (`GET /api/security/sessions`)
- [ ] All active sessions shown
- [ ] Device info displayed
- [ ] Last activity tracked
- [ ] Individual session revocation working
- [ ] Revoke all sessions working

**Test:**
```bash
# Get sessions
curl https://yourapp.com/api/security/sessions

# Revoke specific session
curl -X DELETE "https://yourapp.com/api/security/sessions?session_id=xxx"

# Revoke all
curl -X DELETE "https://yourapp.com/api/security/sessions?revoke_all=true"
```

---

### Security Events (Admin)
- [ ] Security events API working (`GET /api/security/events`)
- [ ] Admin access required
- [ ] Events properly categorized
- [ ] Severity levels assigned
- [ ] Event resolution working
- [ ] Filters working (severity, resolved)

**Event Types:**
- [ ] Failed login attempts
- [ ] Rate limit exceeded
- [ ] CSRF violations
- [ ] Invalid sessions
- [ ] Unauthorized access
- [ ] Suspicious activity

**Test:**
```bash
# Get all events
curl https://yourapp.com/api/security/events

# Get high severity
curl "https://yourapp.com/api/security/events?severity=high"

# Resolve event
curl -X PATCH https://yourapp.com/api/security/events \
  -d '{"eventId": "xxx", "resolved": true}'
```

---

## 💾 Database Setup

### Migrations
- [ ] Security tables migration run
- [ ] `user_consents` table created
- [ ] `audit_logs` table created
- [ ] `user_sessions` table created
- [ ] `failed_login_attempts` table created
- [ ] `security_events` table created
- [ ] Indexes created
- [ ] RLS policies enabled
- [ ] Triggers created

**Run Migration:**
```bash
psql $DATABASE_URL -f database/migrations/security-tables.sql
```

**Verify:**
```sql
-- Check tables exist
\dt user_consents
\dt audit_logs
\dt user_sessions
\dt failed_login_attempts
\dt security_events

-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_consents', 'audit_logs', 'user_sessions');
```

---

### Database Security
- [ ] SSL enabled for connections
- [ ] RLS policies tested
- [ ] Users can only access their own data
- [ ] Admin tables protected
- [ ] Cleanup function created
- [ ] Backup strategy in place

**Check SSL:**
```sql
SHOW ssl;
```

---

## 🌐 Environment Variables

### Production Environment
- [ ] All required variables set
- [ ] No default/placeholder values
- [ ] Secrets properly secured
- [ ] Variables validated on startup

**Required:**
```env
# Encryption
ENCRYPTION_KEY=<64-char-hex>

# Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# GDPR
PRIVACY_POLICY_VERSION=1.0.0

# General
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://yourapp.com

# Database
DATABASE_URL=postgresql://...?sslmode=require

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

**Validate:**
```typescript
import { validateSecurityEnvironment } from '@/lib/security/data-encryption'

const result = validateSecurityEnvironment()
if (!result.isValid) {
  console.error(result.errors)
  process.exit(1)
}
```

---

## 🧪 Testing

### Manual Testing
- [ ] Create account with weak password - blocked
- [ ] Create account with strong password - success
- [ ] Login with wrong password 6 times - rate limited
- [ ] Session expires after 30 min - logged out
- [ ] CSRF token missing - request blocked
- [ ] Export data - receives JSON file
- [ ] Delete account - all data removed
- [ ] Grant consent - recorded
- [ ] Revoke consent - updated

---

### Automated Testing
- [ ] Password validation tests
- [ ] Session management tests
- [ ] Encryption/decryption tests
- [ ] CSRF protection tests
- [ ] Rate limiting tests
- [ ] GDPR compliance tests
- [ ] Input sanitization tests

---

## 🚀 Pre-Production

### Final Checks
- [ ] All security features tested
- [ ] No secrets in git
- [ ] Environment variables verified
- [ ] SSL certificates valid
- [ ] Database migrations run
- [ ] Rate limiting configured
- [ ] Monitoring enabled
- [ ] Alerts configured
- [ ] Documentation reviewed
- [ ] Security scan passed

---

### Go-Live
- [ ] Security headers verified in production
- [ ] Rate limiting tested in production
- [ ] GDPR endpoints tested
- [ ] Session management tested
- [ ] Audit logging verified
- [ ] Backup tested
- [ ] Incident response plan ready

---

## 📅 Regular Maintenance

### Daily
- [ ] Review security events
- [ ] Check for suspicious activity
- [ ] Monitor failed login attempts

### Weekly
- [ ] Review audit logs
- [ ] Check rate limit metrics
- [ ] Verify backups

### Monthly
- [ ] Update dependencies
- [ ] Review security policies
- [ ] Clean up old sessions
- [ ] Run security scan

### Quarterly
- [ ] Rotate encryption keys
- [ ] Review access controls
- [ ] Update privacy policy if needed
- [ ] Security training

---

## 🆘 Incident Response

### If Security Breach Detected
1. [ ] Identify scope of breach
2. [ ] Contain the breach
3. [ ] Revoke all sessions
4. [ ] Rotate encryption keys
5. [ ] Notify affected users (GDPR requirement)
6. [ ] Document incident
7. [ ] Review and improve security

### If Data Leak Suspected
1. [ ] Verify the leak
2. [ ] Identify source
3. [ ] Rotate exposed credentials
4. [ ] Notify affected users
5. [ ] Report to authorities (if required by GDPR)

---

## ✅ Completion

Once all items are checked:
- [ ] Security implementation is complete
- [ ] All tests passed
- [ ] Documentation reviewed
- [ ] Team trained
- [ ] Ready for production

**Last Updated:** _________
**Reviewed By:** _________
**Next Review:** _________
