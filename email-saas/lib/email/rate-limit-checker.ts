// Email Sending Rate Limit Checker

import { createClient } from '@/lib/supabase/server'
import { emailRatelimit } from '@/lib/rate-limit'
import { ApiError } from '@/lib/errors/api-error'

type Plan = 'free' | 'starter' | 'growth' | 'pro' | 'scale'

interface RateLimitCheck {
  allowed: boolean
  remaining: number
  limit: number
  reset: number
}

export async function checkEmailSendingLimit(
  userId: string,
  emailCount: number
): Promise<RateLimitCheck> {
  const supabase = await createClient()

  // Get user's plan from database
  const { data: userData, error } = await supabase
    .from('users')
    .select('plan')
    .eq('id', userId)
    .single()

  if (error || !userData) {
    throw new ApiError(500, 'Failed to check user plan')
  }

  const plan: Plan = userData.plan || 'free'
  const limiter = emailRatelimit[plan]

  // Check rate limit
  const { success, limit, remaining, reset } = await limiter.limit(userId)

  // Also check if trying to send more than remaining
  if (success && emailCount > remaining) {
    return {
      allowed: false,
      remaining,
      limit,
      reset,
    }
  }

  return {
    allowed: success,
    remaining,
    limit,
    reset,
  }
}

// Monthly email limits (separate from hourly rate limits)
export const MONTHLY_EMAIL_LIMITS: Record<Plan, number> = {
  free: 10000, // 10k/month
  starter: 50000, // 50k/month
  growth: 150000, // 150k/month
  pro: 300000, // 300k/month
  scale: 1000000, // 1M/month
}

export async function checkMonthlyEmailLimit(
  userId: string,
  plan: Plan,
  emailCount: number
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const supabase = await createClient()

  // Get emails sent this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('email_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  if (error) {
    throw new ApiError(500, 'Failed to check email usage')
  }

  const used = count || 0
  const limit = MONTHLY_EMAIL_LIMITS[plan]
  const allowed = used + emailCount <= limit

  return { allowed, used, limit }
}
