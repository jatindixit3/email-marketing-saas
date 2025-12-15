# Security Dependencies

Install these packages for the security implementation:

## Required Dependencies

```bash
npm install bcryptjs
npm install @upstash/redis @upstash/ratelimit
```

## Development Dependencies

```bash
npm install -D @types/bcryptjs
```

## Package Versions

- **bcryptjs** - ^2.4.3 - Password hashing with bcrypt
- **@upstash/redis** - ^1.25.1 - Redis client for Upstash
- **@upstash/ratelimit** - ^1.0.1 - Rate limiting with Upstash Redis

## Installation Command

```bash
# Install all security dependencies at once
npm install bcryptjs @upstash/redis @upstash/ratelimit && npm install -D @types/bcryptjs
```

## Verification

After installation, verify the packages are in your package.json:

```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "@upstash/redis": "^1.25.1",
    "@upstash/ratelimit": "^1.0.1"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6"
  }
}
```

## Package Details

### bcryptjs
- **Purpose:** Password hashing
- **Usage:** Secure password storage with bcrypt algorithm
- **Cost Factor:** 12 (recommended for production)
- **Documentation:** https://www.npmjs.com/package/bcryptjs

### @upstash/redis
- **Purpose:** Redis client for Upstash
- **Usage:** Connect to Upstash Redis for rate limiting
- **Features:** REST API, edge-compatible
- **Documentation:** https://www.npmjs.com/package/@upstash/redis

### @upstash/ratelimit
- **Purpose:** Rate limiting
- **Usage:** Implement rate limits with sliding window
- **Features:** Multiple algorithms, analytics
- **Documentation:** https://www.npmjs.com/package/@upstash/ratelimit

## Setup After Installation

1. **Create Upstash Account:**
   - Sign up at https://console.upstash.com/
   - Create a Redis database
   - Copy REST URL and token

2. **Add to .env:**
   ```env
   UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token-here
   ENCRYPTION_KEY=your-64-char-hex-key
   PRIVACY_POLICY_VERSION=1.0.0
   ```

3. **Generate Encryption Key:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Run Database Migrations:**
   ```bash
   psql $DATABASE_URL -f database/migrations/security-tables.sql
   ```

## Testing Installation

Create a test file to verify:

```typescript
// test-security.ts
import bcrypt from 'bcryptjs'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

async function testInstallation() {
  // Test bcrypt
  const hash = await bcrypt.hash('password', 12)
  const valid = await bcrypt.compare('password', hash)
  console.log('✓ bcrypt working:', valid)

  // Test Redis (requires env vars)
  if (process.env.UPSTASH_REDIS_REST_URL) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })

    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
    })

    const result = await limiter.limit('test-key')
    console.log('✓ Rate limiting working:', result.success)
  }
}

testInstallation()
```

Run with:
```bash
npx tsx test-security.ts
```

## Troubleshooting

### bcryptjs not found
```bash
npm install bcryptjs @types/bcryptjs
```

### Upstash connection error
- Verify UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env
- Check Redis database is active in Upstash console
- Ensure environment variables are loaded

### TypeScript errors
```bash
npm install -D @types/bcryptjs
```

## Next Steps

After installing dependencies:
1. ✅ Install packages
2. ✅ Set up Upstash Redis
3. ✅ Add environment variables
4. ✅ Generate encryption key
5. ✅ Run database migrations
6. ✅ Test security features
7. ✅ Review [SECURITY_IMPLEMENTATION_GUIDE.md](SECURITY_IMPLEMENTATION_GUIDE.md)
8. ✅ Complete [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)
