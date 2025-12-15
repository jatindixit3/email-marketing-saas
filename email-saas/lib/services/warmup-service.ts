// Email Warmup Service
// Manages warmup limits, stages, and progression

import { createClient } from '@/lib/supabase/server'

export interface WarmupStatus {
  userId: string
  stage: number
  stageName: string
  dailyLimit: number
  emailsSentToday: number
  remainingToday: number
  isWarmupActive: boolean
  accountAgeDays: number
  nextStageIn: number | null // days until next stage
  progress: number // 0-100%
  dnsAuthStatus: {
    spf: boolean
    dkim: boolean
    dmarc: boolean
    allVerified: boolean
  }
}

export interface WarmupStage {
  stage: number
  name: string
  minDays: number
  maxDays: number
  dailyLimit: number
  description: string
}

// Warmup stage configuration
export const WARMUP_STAGES: WarmupStage[] = [
  {
    stage: 1,
    name: 'Initial Warmup',
    minDays: 0,
    maxDays: 3,
    dailyLimit: 50,
    description: 'Building initial sender reputation',
  },
  {
    stage: 2,
    name: 'Growing Volume',
    minDays: 4,
    maxDays: 7,
    dailyLimit: 200,
    description: 'Gradually increasing send volume',
  },
  {
    stage: 3,
    name: 'Scaling Up',
    minDays: 8,
    maxDays: 14,
    dailyLimit: 1000,
    description: 'Approaching full capacity',
  },
  {
    stage: 4,
    name: 'Fully Warmed',
    minDays: 15,
    maxDays: Infinity,
    dailyLimit: Infinity,
    description: 'Ready for full volume sending',
  },
]

/**
 * Get warmup status for a user
 */
export async function getWarmupStatus(userId: string): Promise<WarmupStatus | null> {
  const supabase = await createClient()

  const { data: warmup, error } = await supabase
    .from('email_warmup')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !warmup) {
    return null
  }

  // Calculate account age in days
  const accountAgeDays = Math.floor(
    (Date.now() - new Date(warmup.warmup_start_date).getTime()) / (1000 * 60 * 60 * 24)
  )

  // Get current stage info
  const stageInfo = WARMUP_STAGES[warmup.warmup_stage - 1] || WARMUP_STAGES[3]

  // Calculate days until next stage
  let nextStageIn: number | null = null
  if (warmup.warmup_stage < 4) {
    const nextStage = WARMUP_STAGES[warmup.warmup_stage]
    nextStageIn = nextStage.minDays - accountAgeDays
  }

  // Calculate progress (0-100%)
  const totalWarmupDays = 15 // Total days to complete warmup
  const progress = Math.min(100, Math.round((accountAgeDays / totalWarmupDays) * 100))

  // Calculate remaining emails today
  const remainingToday = Math.max(0, warmup.daily_send_limit - warmup.emails_sent_today)

  return {
    userId,
    stage: warmup.warmup_stage,
    stageName: stageInfo.name,
    dailyLimit: warmup.daily_send_limit,
    emailsSentToday: warmup.emails_sent_today,
    remainingToday,
    isWarmupActive: warmup.is_warmup_active,
    accountAgeDays,
    nextStageIn,
    progress,
    dnsAuthStatus: {
      spf: warmup.spf_verified || false,
      dkim: warmup.dkim_verified || false,
      dmarc: warmup.dmarc_verified || false,
      allVerified:
        (warmup.spf_verified || false) &&
        (warmup.dkim_verified || false) &&
        (warmup.dmarc_verified || false),
    },
  }
}

/**
 * Check if user can send specified number of emails
 */
export async function canSendEmails(
  userId: string,
  emailCount: number
): Promise<{ allowed: boolean; reason?: string; limit?: number; current?: number }> {
  const supabase = await createClient()

  // Get warmup status
  const { data: warmup, error } = await supabase
    .from('email_warmup')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !warmup) {
    return { allowed: false, reason: 'Warmup configuration not found' }
  }

  // Reset daily counter if needed
  const today = new Date().toISOString().split('T')[0]
  const lastResetDate = warmup.last_reset_date

  if (lastResetDate !== today) {
    await supabase
      .from('email_warmup')
      .update({
        emails_sent_today: 0,
        last_reset_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    warmup.emails_sent_today = 0
  }

  // If warmup is not active (completed), allow sends based on plan limit
  if (!warmup.is_warmup_active) {
    return { allowed: true }
  }

  // Check against warmup limit
  const remainingToday = warmup.daily_send_limit - warmup.emails_sent_today

  if (emailCount > remainingToday) {
    return {
      allowed: false,
      reason: `Warmup limit reached. You can send ${remainingToday} more emails today.`,
      limit: warmup.daily_send_limit,
      current: warmup.emails_sent_today,
    }
  }

  return { allowed: true }
}

/**
 * Increment send count for warmup tracking
 */
export async function trackWarmupSend(userId: string, emailCount: number): Promise<void> {
  const supabase = await createClient()

  // Update warmup table
  await supabase.rpc('increment_warmup_sends', {
    p_user_id: userId,
    p_count: emailCount,
  })

  // Update daily history
  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('warmup_daily_history')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  if (existing) {
    await supabase
      .from('warmup_daily_history')
      .update({
        emails_sent: existing.emails_sent + emailCount,
      })
      .eq('id', existing.id)
  } else {
    // Get current warmup info
    const { data: warmup } = await supabase
      .from('email_warmup')
      .select('warmup_stage, daily_send_limit')
      .eq('user_id', userId)
      .single()

    await supabase.from('warmup_daily_history').insert({
      user_id: userId,
      date: today,
      emails_sent: emailCount,
      warmup_stage: warmup?.warmup_stage || 1,
      daily_limit: warmup?.daily_send_limit || 50,
    })
  }
}

/**
 * Update warmup stages for all users (run daily via cron)
 */
export async function updateAllWarmupStages(): Promise<void> {
  const supabase = await createClient()

  // Call the database function
  await supabase.rpc('update_warmup_stage')
}

/**
 * Get warmup history for a user
 */
export async function getWarmupHistory(
  userId: string,
  days: number = 30
): Promise<any[]> {
  const supabase = await createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('warmup_daily_history')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching warmup history:', error)
    return []
  }

  return data || []
}

/**
 * Get warmup milestones for a user
 */
export async function getWarmupMilestones(userId: string): Promise<any[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('warmup_milestones')
    .select('*')
    .eq('user_id', userId)
    .order('achieved_at', { ascending: false })

  if (error) {
    console.error('Error fetching milestones:', error)
    return []
  }

  return data || []
}

/**
 * Get warmup alerts for a user
 */
export async function getWarmupAlerts(
  userId: string,
  unreadOnly: boolean = false
): Promise<any[]> {
  const supabase = await createClient()

  let query = supabase
    .from('warmup_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (unreadOnly) {
    query = query.eq('is_read', false)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching alerts:', error)
    return []
  }

  return data || []
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(alertId: string): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('warmup_alerts')
    .update({ is_read: true })
    .eq('id', alertId)
}

/**
 * Create a warmup alert
 */
export async function createWarmupAlert(
  userId: string,
  type: string,
  severity: 'info' | 'warning' | 'critical',
  title: string,
  message: string,
  data?: any
): Promise<void> {
  const supabase = await createClient()

  await supabase.from('warmup_alerts').insert({
    user_id: userId,
    alert_type: type,
    severity,
    title,
    message,
    data: data || {},
  })
}

/**
 * Check for reputation issues and create alerts
 */
export async function checkReputationAndAlert(userId: string): Promise<void> {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  const { data: history } = await supabase
    .from('warmup_daily_history')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  if (!history || history.emails_sent === 0) {
    return
  }

  const bounceRate = (history.emails_bounced / history.emails_sent) * 100
  const complaintRate = (history.emails_complained / history.emails_sent) * 100

  // High bounce rate alert
  if (bounceRate > 5) {
    await createWarmupAlert(
      userId,
      'high_bounce_rate',
      bounceRate > 10 ? 'critical' : 'warning',
      'High Bounce Rate Detected',
      `Your bounce rate is ${bounceRate.toFixed(1)}%. Clean your contact list to improve sender reputation.`,
      { bounce_rate: bounceRate, emails_bounced: history.emails_bounced }
    )
  }

  // Spam complaint alert
  if (complaintRate > 0.1) {
    await createWarmupAlert(
      userId,
      'spam_complaints',
      'critical',
      'Spam Complaints Detected',
      `You have received ${history.emails_complained} spam complaints. Review your content and ensure proper opt-in.`,
      { complaint_rate: complaintRate, complaints: history.emails_complained }
    )
  }

  // Low engagement warning (during warmup)
  const { data: warmup } = await supabase
    .from('email_warmup')
    .select('is_warmup_active')
    .eq('user_id', userId)
    .single()

  if (warmup?.is_warmup_active) {
    const openRate = (history.opens / history.emails_sent) * 100

    if (openRate < 10 && history.emails_sent > 20) {
      await createWarmupAlert(
        userId,
        'low_engagement',
        'warning',
        'Low Engagement During Warmup',
        `Your open rate is ${openRate.toFixed(1)}%. Consider sending to more engaged contacts during warmup.`,
        { open_rate: openRate }
      )
    }
  }
}

/**
 * Get recommended daily send count based on current stage and past performance
 */
export async function getRecommendedDailySend(userId: string): Promise<number> {
  const status = await getWarmupStatus(userId)
  if (!status) return 0

  // If warmup is complete, return plan limit
  if (!status.isWarmupActive) {
    return Infinity
  }

  // During warmup, recommend 80% of daily limit to stay safe
  return Math.floor(status.dailyLimit * 0.8)
}
