// Rate Limiting using Upstash Redis

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Create Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// API rate limit: 100 requests per minute per user
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit:api',
})

// Email sending rate limit (based on plan)
export const emailRatelimit = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 emails per hour
    prefix: 'ratelimit:email:free',
  }),
  starter: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 h'), // 50 per hour
    prefix: 'ratelimit:email:starter',
  }),
  growth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(150, '1 h'), // 150 per hour
    prefix: 'ratelimit:email:growth',
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, '1 h'), // 300 per hour
    prefix: 'ratelimit:email:pro',
  }),
  scale: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 h'), // 1000 per hour
    prefix: 'ratelimit:email:scale',
  }),
}

// Auth rate limit: 5 login attempts per 15 minutes
export const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  prefix: 'ratelimit:auth',
})

// Password reset rate limit: 3 attempts per hour
export const passwordResetRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: 'ratelimit:password-reset',
})
