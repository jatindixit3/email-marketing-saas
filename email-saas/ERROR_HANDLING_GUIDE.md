# Comprehensive Error Handling Guide

Complete guide for error handling, validation, and rate limiting in the Email Marketing SaaS application.

---

## Table of Contents

1. [Overview](#overview)
2. [API Error Handling](#api-error-handling)
3. [Form Validation](#form-validation)
4. [Email Validation](#email-validation)
5. [Rate Limiting](#rate-limiting)
6. [Environment Setup](#environment-setup)
7. [Usage Examples](#usage-examples)
8. [Best Practices](#best-practices)

---

## Overview

The error handling system provides:

- ✅ **Standardized API responses** with consistent error format
- ✅ **Client & server-side validation** without Zod (native TypeScript)
- ✅ **Advanced email validation** with disposable email detection
- ✅ **Multi-tier rate limiting** (API, email sending, auth)
- ✅ **Comprehensive logging** with context
- ✅ **XSS prevention** through input sanitization

---

## API Error Handling

### Error Response Format

All API errors follow this standard format:

```typescript
{
  success: false,
  error: {
    message: "User-friendly error message",
    code: "ERROR_CODE",
    statusCode: 400,
    details: {
      // Additional context
    },
    timestamp: "2025-01-15T10:00:00Z",
    path: "/api/campaigns"
  }
}
```

Success responses:

```typescript
{
  success: true,
  data: { /* response data */ },
  message: "Optional success message"
}
```

### HTTP Status Codes

- **200** - Success (GET, PATCH)
- **201** - Created (POST)
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (not authenticated)
- **403** - Forbidden (authenticated but not authorized)
- **404** - Not Found
- **429** - Rate Limit Exceeded
- **500** - Internal Server Error

### Creating API Routes with Error Handling

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleError, handleSupabaseError } from '@/lib/errors/error-handler'
import { ApiError, SuccessResponse } from '@/lib/errors/api-error'
import { logger } from '@/lib/logging/logger'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED')
    }

    // 2. Rate Limiting
    const rateLimitResult = await withRateLimit(request, user.id)
    if (!rateLimitResult.success) {
      return rateLimitResult.error!
    }

    // 3. Database Query
    const { data, error: dbError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', user.id)

    if (dbError) {
      throw handleSupabaseError(dbError)
    }

    // 4. Log Success
    logger.info('Campaigns fetched', {
      userId: user.id,
      count: data?.length || 0
    })

    // 5. Return Success
    const response: SuccessResponse = {
      success: true,
      data
    }

    return NextResponse.json(response)
  } catch (error) {
    return handleError(error, request.nextUrl.pathname)
  }
}
```

### Custom Error Types

```typescript
import { ApiError } from '@/lib/errors/api-error'

// Validation error
throw new ApiError(400, 'Invalid email format', 'VALIDATION_ERROR', {
  field: 'email',
  value: 'invalid-email'
})

// Unauthorized
throw new ApiError(401, 'You must be logged in', 'UNAUTHORIZED')

// Not found
throw new ApiError(404, 'Campaign not found', 'NOT_FOUND')

// Rate limit
throw new ApiError(429, 'Too many requests', 'RATE_LIMIT_EXCEEDED', {
  retryAfter: '60s'
})
```

### Logging

```typescript
import { logger } from '@/lib/logging/logger'

// Info level
logger.info('User logged in', {
  userId: user.id,
  timestamp: new Date().toISOString()
})

// Warning level
logger.warn('High API usage detected', {
  userId: user.id,
  requestCount: 95
})

// Error level
logger.error('Failed to send email', {
  userId: user.id,
  campaignId: campaign.id,
  error: error.message
})

// Debug level (development only)
logger.debug('Processing campaign', {
  campaignId: campaign.id,
  recipientCount: recipients.length
})
```

---

## Form Validation

### Validation Functions

Available validators in `lib/validation/validators.ts`:

```typescript
import { validators } from '@/lib/validation/validators'

// Required field
validators.required(value, 'Field name')

// Email format
validators.email(email)

// Length constraints
validators.minLength(value, 3, 'Field name')
validators.maxLength(value, 100, 'Field name')

// Pattern matching
validators.pattern(value, /^[A-Z]+$/, 'Must be uppercase letters')

// URL validation
validators.url(url)

// Field matching
validators.match(password, confirmPassword, 'Passwords')

// Number validation
validators.number(value)
validators.positiveNumber(value)
validators.integer(value)
```

### Sanitization

```typescript
import { sanitize } from '@/lib/validation/validators'

// Prevent XSS in HTML
const safe = sanitize.html(userInput)

// Normalize email
const email = sanitize.email('User@Example.COM') // -> 'user@example.com'

// Trim whitespace
const cleaned = sanitize.string('  hello  ') // -> 'hello'
```

### Pre-built Form Validators

```typescript
import {
  validateCampaignForm,
  validateContactForm,
  validateListForm,
  validateTemplateForm
} from '@/lib/validation/forms'

// Campaign validation
const result = validateCampaignForm({
  name: 'Summer Sale',
  subject: '50% Off Everything!',
  list_ids: ['list-1', 'list-2']
})

if (!result.valid) {
  console.error(result.errors)
  // { name: "Campaign name must be at least 3 characters" }
}
```

### Client-Side Validation Hook

```typescript
'use client'

import { useFormValidation } from '@/hooks/use-form-validation'
import { validateCampaignForm } from '@/lib/validation/forms'

function MyForm() {
  const [formData, setFormData] = useState({ name: '', subject: '' })

  const { validate, validateField, getFieldError } = useFormValidation(
    validateCampaignForm
  )

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)

    // Real-time validation
    validateField(newData, field)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    if (!validate(formData)) {
      return // Show errors
    }

    // Submit form
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      {getFieldError('name') && <p>{getFieldError('name')}</p>}
    </form>
  )
}
```

### Server-Side Validation (API Routes)

```typescript
import { validateCampaignForm } from '@/lib/validation/forms'
import { sanitize } from '@/lib/validation/validators'
import { ApiError } from '@/lib/errors/api-error'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Sanitize inputs
    const sanitizedData = {
      name: sanitize.string(body.name),
      subject: sanitize.string(body.subject),
      body_html: body.body_html
    }

    // Validate
    const validation = validateCampaignForm(sanitizedData)
    if (!validation.valid) {
      throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', {
        errors: validation.errors
      })
    }

    // Proceed with valid data
    // ...
  } catch (error) {
    return handleError(error)
  }
}
```

---

## Email Validation

### Basic Email Validation

```typescript
import { validateEmailFormat } from '@/lib/validation/email-validator'

const isValid = validateEmailFormat('user@example.com') // true
const isInvalid = validateEmailFormat('invalid-email') // false
```

### Disposable Email Detection

```typescript
import { isDisposableEmail } from '@/lib/validation/email-validator'

const isDisposable = isDisposableEmail('user@tempmail.com') // true
const isReal = isDisposableEmail('user@gmail.com') // false
```

### MX Record Verification (Server-Side Only)

```typescript
import { verifyMxRecord } from '@/lib/validation/email-validator'

const hasValidDomain = await verifyMxRecord('user@example.com')
```

### Comprehensive Validation

```typescript
import { validateEmail } from '@/lib/validation/email-validator'

const result = await validateEmail('user@example.com', {
  checkDisposable: true,
  checkMxRecord: true // Optional, slow - only for critical operations
})

if (!result.valid) {
  console.error(result.error)
  // "Disposable email addresses are not allowed"
  // "Email domain does not exist"
}

console.log(result.details)
// {
//   format: true,
//   disposable: false,
//   mxRecord: true
// }
```

### Bulk Email Validation (CSV Import)

```typescript
import { validateEmailBatch } from '@/lib/validation/email-validator'

const emails = ['user1@example.com', 'user2@tempmail.com', 'invalid']
const results = await validateEmailBatch(emails)

results.forEach((result, email) => {
  if (!result.valid) {
    console.error(`${email}: ${result.error}`)
  }
})
```

---

## Rate Limiting

### API Rate Limiting

**Limit**: 100 requests per minute per user

```typescript
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'

export async function GET(request: NextRequest) {
  const user = await getUser()

  // Check rate limit
  const rateLimitResult = await withRateLimit(request, user.id)
  if (!rateLimitResult.success) {
    return rateLimitResult.error! // Returns 429 with headers
  }

  // Proceed with request
}
```

Response headers when rate limited:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-01-15T10:01:00.000Z
```

### Email Sending Rate Limits

**Hourly limits by plan:**
- Free: 10 emails/hour
- Starter: 50 emails/hour
- Growth: 150 emails/hour
- Pro: 300 emails/hour
- Scale: 1000 emails/hour

**Monthly limits by plan:**
- Free: 10,000 emails/month
- Starter: 50,000 emails/month
- Growth: 150,000 emails/month
- Pro: 300,000 emails/month
- Scale: 1,000,000 emails/month

```typescript
import { checkEmailSendingLimit, checkMonthlyEmailLimit } from '@/lib/email/rate-limit-checker'

// Check hourly limit
const hourlyLimit = await checkEmailSendingLimit(userId, recipientCount)
if (!hourlyLimit.allowed) {
  throw new ApiError(
    429,
    `Hourly limit reached. ${hourlyLimit.remaining} sends remaining.`,
    'EMAIL_RATE_LIMIT_EXCEEDED'
  )
}

// Check monthly limit
const monthlyLimit = await checkMonthlyEmailLimit(userId, userPlan, recipientCount)
if (!monthlyLimit.allowed) {
  throw new ApiError(
    429,
    `Monthly limit reached. Used ${monthlyLimit.used} of ${monthlyLimit.limit}.`,
    'MONTHLY_LIMIT_EXCEEDED'
  )
}
```

### Authentication Rate Limiting

**Limit**: 5 login attempts per 15 minutes

```typescript
import { authRatelimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  // Rate limit by email address
  const { success } = await authRatelimit.limit(email)
  if (!success) {
    throw new ApiError(429, 'Too many login attempts', 'AUTH_RATE_LIMIT')
  }

  // Proceed with login
}
```

### Password Reset Rate Limiting

**Limit**: 3 attempts per hour

```typescript
import { passwordResetRatelimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  const { success } = await passwordResetRatelimit.limit(email)
  if (!success) {
    throw new ApiError(429, 'Too many reset attempts', 'RESET_RATE_LIMIT')
  }

  // Send reset email
}
```

---

## Environment Setup

### 1. Install Dependencies

```bash
npm install @upstash/ratelimit @upstash/redis
```

### 2. Setup Upstash Redis

1. Go to [https://console.upstash.com/](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the REST URL and Token
4. Add to `.env.local`:

```bash
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### 3. Complete Environment Variables

Create `.env.local` with all required variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_SES_FROM_EMAIL=noreply@yourdomain.com

# Application
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
```

---

## Usage Examples

### Complete API Route Example

See: [app/api/example-with-error-handling/route.ts](app/api/example-with-error-handling/route.ts)

### Complete Form Component Example

See: [components/forms/example-campaign-form.tsx](components/forms/example-campaign-form.tsx)

### Email Validation in Contact Import

```typescript
import { validateEmail, isDisposableEmail } from '@/lib/validation/email-validator'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  // Quick check
  if (isDisposableEmail(email)) {
    throw new ApiError(400, 'Disposable emails not allowed', 'VALIDATION_ERROR')
  }

  // Full validation
  const result = await validateEmail(email, { checkDisposable: true })
  if (!result.valid) {
    throw new ApiError(400, result.error!, 'VALIDATION_ERROR')
  }

  // Save contact
}
```

---

## Best Practices

### 1. Always Sanitize User Input

```typescript
import { sanitize } from '@/lib/validation/validators'

// Before saving to database
const safeName = sanitize.string(userInput.name)
const safeEmail = sanitize.email(userInput.email)

// Before displaying user-generated HTML
const safeHtml = sanitize.html(userInput.bio)
```

### 2. Validate on Both Client and Server

```typescript
// Client-side: Immediate feedback
const { validate } = useFormValidation(validateCampaignForm)
if (!validate(formData)) return

// Server-side: Security layer
const validation = validateCampaignForm(sanitizedData)
if (!validation.valid) {
  throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR')
}
```

### 3. Use Appropriate HTTP Status Codes

```typescript
// 400 - Client error (validation, bad request)
throw new ApiError(400, 'Invalid email format')

// 401 - Not authenticated
throw new ApiError(401, 'Please log in')

// 403 - Authenticated but not authorized
throw new ApiError(403, 'You do not own this resource')

// 404 - Resource not found
throw new ApiError(404, 'Campaign not found')

// 429 - Rate limit exceeded
throw new ApiError(429, 'Too many requests')

// 500 - Server error
throw new ApiError(500, 'Database connection failed')
```

### 4. Log All Errors with Context

```typescript
import { logger } from '@/lib/logging/logger'

try {
  // ... operation
} catch (error) {
  logger.error('Failed to create campaign', {
    userId: user.id,
    campaignData: data,
    error: error.message,
    stack: error.stack
  })

  throw handleError(error)
}
```

### 5. Handle Rate Limits Gracefully

```typescript
// Check rate limit first
const { success, reset } = await ratelimit.limit(user.id)
if (!success) {
  const resetTime = new Date(reset).toLocaleTimeString()
  throw new ApiError(
    429,
    `Rate limit exceeded. Try again at ${resetTime}`,
    'RATE_LIMIT_EXCEEDED',
    { retryAfter: reset }
  )
}
```

---

## File Reference

### Error Handling
- [lib/errors/api-error.ts](lib/errors/api-error.ts) - Error types
- [lib/errors/error-handler.ts](lib/errors/error-handler.ts) - Error handlers
- [lib/logging/logger.ts](lib/logging/logger.ts) - Logging utility

### Validation
- [lib/validation/validators.ts](lib/validation/validators.ts) - Core validators
- [lib/validation/forms.ts](lib/validation/forms.ts) - Form validators
- [lib/validation/email-validator.ts](lib/validation/email-validator.ts) - Email validation

### Rate Limiting
- [lib/rate-limit.ts](lib/rate-limit.ts) - Rate limiters
- [lib/middleware/rate-limit-middleware.ts](lib/middleware/rate-limit-middleware.ts) - Middleware
- [lib/email/rate-limit-checker.ts](lib/email/rate-limit-checker.ts) - Email limits

### Examples
- [app/api/example-with-error-handling/route.ts](app/api/example-with-error-handling/route.ts) - API example
- [components/forms/example-campaign-form.tsx](components/forms/example-campaign-form.tsx) - Form example

---

**Error-Free Development! 🛡️**
