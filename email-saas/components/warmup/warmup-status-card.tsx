'use client'

// Warmup Status Card Component
// Shows current warmup stage, limits, and progress

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  ArrowRight,
} from 'lucide-react'
import { WarmupStatus } from '@/lib/services/warmup-service'

interface WarmupStatusCardProps {
  status: WarmupStatus
  onViewDetails?: () => void
}

export function WarmupStatusCard({ status, onViewDetails }: WarmupStatusCardProps) {
  const {
    stage,
    stageName,
    dailyLimit,
    emailsSentToday,
    remainingToday,
    isWarmupActive,
    accountAgeDays,
    nextStageIn,
    progress,
  } = status

  const usagePercentage = (emailsSentToday / dailyLimit) * 100

  // Stage color
  const stageColor = isWarmupActive
    ? stage === 1
      ? 'text-orange-500'
      : stage === 2
      ? 'text-yellow-500'
      : stage === 3
      ? 'text-blue-500'
      : 'text-green-500'
    : 'text-green-500'

  const stageBadgeVariant = isWarmupActive ? 'default' : 'secondary'

  return (
    <Card className="border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5 p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Email Warmup Status</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {isWarmupActive
              ? 'Gradually building your sender reputation'
              : 'Warmup completed - full sending access'}
          </p>
        </div>
        <Badge variant={stageBadgeVariant} className={stageColor}>
          Stage {stage}/4
        </Badge>
      </div>

      {/* Progress Bar */}
      {isWarmupActive && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Warmup Progress</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            {nextStageIn !== null && nextStageIn > 0
              ? `Next stage in ${nextStageIn} day${nextStageIn > 1 ? 's' : ''}`
              : nextStageIn === 0
              ? 'Upgrading to next stage soon...'
              : 'Final stage reached'}
          </p>
        </div>
      )}

      {/* Current Stage Info */}
      <div className="mb-6 rounded-lg border border-purple-500/20 bg-background/50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className={`h-5 w-5 ${stageColor}`} />
          <h4 className="font-semibold text-foreground">{stageName}</h4>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Daily Limit */}
          <div>
            <p className="text-xs text-muted-foreground">Daily Limit</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {dailyLimit === Infinity ? 'Unlimited' : dailyLimit.toLocaleString()}
            </p>
          </div>

          {/* Sent Today */}
          <div>
            <p className="text-xs text-muted-foreground">Sent Today</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {emailsSentToday.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Usage Bar */}
        {isWarmupActive && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Today's Usage</span>
              <span className={usagePercentage > 80 ? 'text-orange-500' : 'text-muted-foreground'}>
                {usagePercentage.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={usagePercentage}
              className={`h-1 ${usagePercentage > 80 ? '[&>div]:bg-orange-500' : ''}`}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {remainingToday.toLocaleString()} emails remaining today
            </p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-background/50 p-3 text-center">
          <Clock className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Account Age</p>
          <p className="mt-1 font-semibold text-foreground">
            {accountAgeDays} day{accountAgeDays !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="rounded-lg bg-background/50 p-3 text-center">
          <Mail className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Remaining</p>
          <p className="mt-1 font-semibold text-foreground">
            {remainingToday === Infinity ? '∞' : remainingToday.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg bg-background/50 p-3 text-center">
          {isWarmupActive ? (
            <AlertCircle className="mx-auto mb-1 h-4 w-4 text-orange-500" />
          ) : (
            <CheckCircle2 className="mx-auto mb-1 h-4 w-4 text-green-500" />
          )}
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="mt-1 text-xs font-semibold text-foreground">
            {isWarmupActive ? 'Active' : 'Complete'}
          </p>
        </div>
      </div>

      {/* Warning if approaching limit */}
      {isWarmupActive && usagePercentage > 80 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-orange-500/30 bg-orange-500/5 p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
          <div>
            <p className="font-medium text-orange-700">Approaching Daily Limit</p>
            <p className="mt-1 text-xs text-orange-600">
              You've used {usagePercentage.toFixed(0)}% of today's send limit. Consider scheduling
              remaining emails for tomorrow.
            </p>
          </div>
        </div>
      )}

      {/* Info about warmup */}
      {isWarmupActive && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-teal-500/30 bg-teal-500/5 p-3 text-sm">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-500" />
          <div>
            <p className="font-medium text-teal-700">Why Warmup?</p>
            <p className="mt-1 text-xs text-teal-600">
              Gradually increasing send volume builds trust with email providers and improves
              deliverability. Your limits will automatically increase as your account ages.
            </p>
          </div>
        </div>
      )}

      {/* Action Button */}
      {onViewDetails && (
        <Button onClick={onViewDetails} variant="outline" className="w-full">
          View Detailed Stats
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </Card>
  )
}
