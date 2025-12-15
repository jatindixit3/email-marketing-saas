// Business Metrics Tracking
// Track signups, MRR, churn, email volume, and other KPIs

import { createClient } from '@/lib/supabase/server'
import { logger } from './structured-logger'
import { trackMetric } from './performance'

export interface DailyMetrics {
  date: string
  signups: number
  activeUsers: number
  mrr: number
  churnedUsers: number
  emailsSent: number
  emailsDelivered: number
  emailsBounced: number
  campaignsSent: number
  revenue: number
}

/**
 * Track user signup
 */
export async function trackSignup(userId: string, email: string, plan: string = 'free') {
  logger.businessEvent('user_signup', {
    userId,
    userEmail: email,
    plan,
  })

  trackMetric({
    name: 'business.signups',
    value: 1,
    unit: 'count',
    tags: {
      plan,
    },
  })

  // Store in database
  const supabase = await createClient()
  await supabase.from('business_events').insert({
    event_type: 'signup',
    user_id: userId,
    data: {
      email,
      plan,
    },
  })
}

/**
 * Track subscription change (upgrade, downgrade, cancel)
 */
export async function trackSubscriptionChange(
  userId: string,
  previousPlan: string,
  newPlan: string,
  mrr: number
) {
  const eventType =
    newPlan === 'cancelled' ? 'churn' : previousPlan === 'free' ? 'conversion' : 'plan_change'

  logger.businessEvent(`subscription_${eventType}`, {
    userId,
    previousPlan,
    newPlan,
    mrr,
  })

  trackMetric({
    name: `business.${eventType}`,
    value: 1,
    unit: 'count',
    tags: {
      from_plan: previousPlan,
      to_plan: newPlan,
    },
  })

  // Track MRR change
  trackMetric({
    name: 'business.mrr',
    value: mrr,
    unit: 'count',
    tags: {
      plan: newPlan,
    },
  })

  const supabase = await createClient()
  await supabase.from('business_events').insert({
    event_type: eventType,
    user_id: userId,
    data: {
      previousPlan,
      newPlan,
      mrr,
    },
  })
}

/**
 * Track email send
 */
export async function trackEmailSend(
  userId: string,
  campaignId: string,
  emailCount: number,
  delivered: number,
  bounced: number
) {
  logger.businessEvent('emails_sent', {
    userId,
    campaignId,
    emailCount,
    delivered,
    bounced,
  })

  trackMetric({
    name: 'business.emails_sent',
    value: emailCount,
    unit: 'count',
    tags: {
      campaignId,
    },
  })

  trackMetric({
    name: 'business.emails_delivered',
    value: delivered,
    unit: 'count',
  })

  trackMetric({
    name: 'business.emails_bounced',
    value: bounced,
    unit: 'count',
  })

  const supabase = await createClient()
  await supabase.from('business_events').insert({
    event_type: 'email_send',
    user_id: userId,
    data: {
      campaignId,
      emailCount,
      delivered,
      bounced,
    },
  })
}

/**
 * Get daily metrics
 */
export async function getDailyMetrics(date: string): Promise<DailyMetrics> {
  const supabase = await createClient()

  // Signups
  const { count: signups } = await supabase
    .from('auth.users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', date)
    .lt('created_at', getNextDay(date))

  // Active users (users who sent emails)
  const { count: activeUsers } = await supabase
    .from('campaigns')
    .select('user_id', { count: 'exact', head: true })
    .gte('sent_at', date)
    .lt('sent_at', getNextDay(date))

  // MRR (sum of all active subscriptions)
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('plan, price')
    .eq('status', 'active')

  const mrr =
    subscriptions?.reduce((sum, sub) => sum + (sub.price || 0), 0) || 0

  // Churned users
  const { count: churnedUsers } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'cancelled')
    .gte('cancelled_at', date)
    .lt('cancelled_at', getNextDay(date))

  // Email metrics
  const { data: emailMetrics } = await supabase
    .from('warmup_daily_history')
    .select('emails_sent, emails_delivered, emails_bounced')
    .eq('date', date)

  const emailsSent = emailMetrics?.reduce((sum, m) => sum + m.emails_sent, 0) || 0
  const emailsDelivered = emailMetrics?.reduce((sum, m) => sum + m.emails_delivered, 0) || 0
  const emailsBounced = emailMetrics?.reduce((sum, m) => sum + m.emails_bounced, 0) || 0

  // Campaigns sent
  const { count: campaignsSent } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'sent')
    .gte('sent_at', date)
    .lt('sent_at', getNextDay(date))

  // Revenue (sum of payments)
  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .gte('created_at', date)
    .lt('created_at', getNextDay(date))

  const revenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0

  return {
    date,
    signups: signups || 0,
    activeUsers: activeUsers || 0,
    mrr,
    churnedUsers: churnedUsers || 0,
    emailsSent,
    emailsDelivered,
    emailsBounced,
    campaignsSent: campaignsSent || 0,
    revenue,
  }
}

/**
 * Calculate churn rate
 */
export async function calculateChurnRate(startDate: string, endDate: string): Promise<number> {
  const supabase = await createClient()

  // Users at start of period
  const { count: startUsers } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .lt('created_at', startDate)

  // Users who churned during period
  const { count: churnedUsers } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'cancelled')
    .gte('cancelled_at', startDate)
    .lt('cancelled_at', endDate)

  if (!startUsers || startUsers === 0) return 0

  return ((churnedUsers || 0) / startUsers) * 100
}

/**
 * Calculate customer lifetime value (CLV)
 */
export async function calculateCLV(): Promise<number> {
  const supabase = await createClient()

  // Average revenue per user
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('price')
    .eq('status', 'active')

  const avgRevenue =
    subscriptions && subscriptions.length > 0
      ? subscriptions.reduce((sum, s) => sum + (s.price || 0), 0) / subscriptions.length
      : 0

  // Average customer lifespan (in months)
  const { data: cancelledSubs } = await supabase
    .from('subscriptions')
    .select('created_at, cancelled_at')
    .eq('status', 'cancelled')
    .not('cancelled_at', 'is', null)

  const avgLifespan =
    cancelledSubs && cancelledSubs.length > 0
      ? cancelledSubs.reduce((sum, s) => {
          const months =
            (new Date(s.cancelled_at!).getTime() - new Date(s.created_at).getTime()) /
            (1000 * 60 * 60 * 24 * 30)
          return sum + months
        }, 0) / cancelledSubs.length
      : 12 // Default to 12 months

  return avgRevenue * avgLifespan
}

/**
 * Get growth metrics (week over week, month over month)
 */
export async function getGrowthMetrics(period: 'week' | 'month' = 'month') {
  const supabase = await createClient()

  const daysAgo = period === 'week' ? 7 : 30
  const periodStart = new Date()
  periodStart.setDate(periodStart.getDate() - daysAgo)

  const prevPeriodStart = new Date()
  prevPeriodStart.setDate(prevPeriodStart.getDate() - daysAgo * 2)

  // Current period signups
  const { count: currentSignups } = await supabase
    .from('auth.users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', periodStart.toISOString())

  // Previous period signups
  const { count: previousSignups } = await supabase
    .from('auth.users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', prevPeriodStart.toISOString())
    .lt('created_at', periodStart.toISOString())

  const signupGrowth =
    previousSignups && previousSignups > 0
      ? (((currentSignups || 0) - previousSignups) / previousSignups) * 100
      : 0

  // Current period revenue
  const { data: currentRevenue } = await supabase
    .from('payments')
    .select('amount')
    .gte('created_at', periodStart.toISOString())

  const currentTotal = currentRevenue?.reduce((sum, p) => sum + p.amount, 0) || 0

  // Previous period revenue
  const { data: previousRevenue } = await supabase
    .from('payments')
    .select('amount')
    .gte('created_at', prevPeriodStart.toISOString())
    .lt('created_at', periodStart.toISOString())

  const previousTotal = previousRevenue?.reduce((sum, p) => sum + p.amount, 0) || 0

  const revenueGrowth =
    previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0

  return {
    period,
    signupGrowth: Number(signupGrowth.toFixed(2)),
    revenueGrowth: Number(revenueGrowth.toFixed(2)),
    currentSignups: currentSignups || 0,
    previousSignups: previousSignups || 0,
    currentRevenue: currentTotal,
    previousRevenue: previousTotal,
  }
}

// Helper function
function getNextDay(date: string): string {
  const nextDay = new Date(date)
  nextDay.setDate(nextDay.getDate() + 1)
  return nextDay.toISOString().split('T')[0]
}

// Database schema for business events
/*
CREATE TABLE IF NOT EXISTS business_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_business_events_type_date ON business_events(event_type, created_at DESC);
CREATE INDEX idx_business_events_user ON business_events(user_id);
*/
