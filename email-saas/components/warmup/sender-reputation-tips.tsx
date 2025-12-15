'use client'

// Sender Reputation Tips Component
// Provides actionable tips for improving sender reputation

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Mail,
  Users,
  Target,
  Shield,
  Zap,
  Clock,
} from 'lucide-react'

interface ReputationMetrics {
  bounceRate: number // percentage
  complaintRate: number // percentage
  openRate: number // percentage
  clickRate: number // percentage
  unsubscribeRate: number // percentage
  reputationScore: number // 0-100
}

interface SenderReputationTipsProps {
  metrics: ReputationMetrics
  warmupStage: number
}

export function SenderReputationTips({ metrics, warmupStage }: SenderReputationTipsProps) {
  const {
    bounceRate,
    complaintRate,
    openRate,
    clickRate,
    unsubscribeRate,
    reputationScore,
  } = metrics

  // Determine overall health
  const isHealthy =
    bounceRate < 2 &&
    complaintRate < 0.1 &&
    openRate > 20 &&
    reputationScore > 80

  const hasWarnings =
    bounceRate >= 2 ||
    complaintRate >= 0.05 ||
    openRate < 15 ||
    reputationScore < 70

  const hasCritical =
    bounceRate >= 5 || complaintRate >= 0.1 || reputationScore < 50

  return (
    <Card className="border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Sender Reputation</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor key metrics to maintain excellent deliverability
        </p>
      </div>

      {/* Reputation Score */}
      <div className="mb-6 rounded-lg border border-purple-500/20 bg-background/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-semibold text-foreground">Overall Score</h4>
          <Badge
            variant={reputationScore >= 80 ? 'default' : 'secondary'}
            className={
              reputationScore >= 80
                ? 'bg-green-500 text-white'
                : reputationScore >= 60
                ? 'bg-yellow-500 text-white'
                : 'bg-red-500 text-white'
            }
          >
            {reputationScore}/100
          </Badge>
        </div>
        <Progress value={reputationScore} className="h-2 mb-2" />
        <div className="flex items-center gap-2 text-sm">
          {reputationScore >= 80 ? (
            <>
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-600">Excellent reputation</span>
            </>
          ) : reputationScore >= 60 ? (
            <>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-yellow-600">Good, but needs improvement</span>
            </>
          ) : (
            <>
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-red-600">Poor reputation - take action</span>
            </>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <MetricCard
          name="Bounce Rate"
          value={bounceRate}
          threshold={{ good: 2, warning: 5 }}
          lower isPercentage
          icon={<Mail />}
        />
        <MetricCard
          name="Spam Complaints"
          value={complaintRate}
          threshold={{ good: 0.05, warning: 0.1 }}
          lower isPercentage
          icon={<Shield />}
        />
        <MetricCard
          name="Open Rate"
          value={openRate}
          threshold={{ good: 20, warning: 10 }}
          higher isPercentage
          icon={<Target />}
        />
        <MetricCard
          name="Click Rate"
          value={clickRate}
          threshold={{ good: 2, warning: 1 }}
          higher isPercentage
          icon={<Zap />}
        />
        <MetricCard
          name="Unsubscribe Rate"
          value={unsubscribeRate}
          threshold={{ good: 0.5, warning: 1 }}
          lower isPercentage
          icon={<Users />}
        />
        <MetricCard
          name="Warmup Stage"
          value={warmupStage}
          max={4}
          icon={<Clock />}
        />
      </div>

      {/* Tips & Recommendations */}
      <div className="space-y-4">
        <h4 className="font-semibold text-foreground">Actionable Tips</h4>

        {/* Critical Issues */}
        {hasCritical && (
          <TipCard
            severity="critical"
            title="Critical Issues Detected"
            description="Your sender reputation is at risk. Take immediate action to avoid blacklisting."
            tips={[
              bounceRate >= 5 && 'High bounce rate: Clean your contact list immediately',
              complaintRate >= 0.1 && 'Spam complaints: Review your content and ensure proper opt-in',
              reputationScore < 50 && 'Low reputation: Pause sending and investigate issues',
            ].filter(Boolean) as string[]}
          />
        )}

        {/* Warnings */}
        {hasWarnings && !hasCritical && (
          <TipCard
            severity="warning"
            title="Areas for Improvement"
            description="Address these issues to maintain good deliverability."
            tips={[
              bounceRate >= 2 && bounceRate < 5 && 'Bounce rate is elevated. Verify email addresses before sending.',
              complaintRate >= 0.05 && complaintRate < 0.1 && 'Some spam complaints detected. Review your sending practices.',
              openRate < 15 && 'Low engagement. Improve subject lines and send to engaged contacts.',
              reputationScore >= 50 && reputationScore < 70 && 'Reputation needs improvement. Follow best practices below.',
            ].filter(Boolean) as string[]}
          />
        )}

        {/* Best Practices (always show) */}
        <TipCard
          severity="info"
          title={isHealthy ? 'Keep Up the Good Work!' : 'Best Practices'}
          description={isHealthy ? 'Your reputation is excellent. Maintain these practices:' : 'Follow these to improve your sender reputation:'}
          tips={[
            '✅ Send only to engaged contacts who opted in',
            '✅ Use double opt-in for new subscribers',
            '✅ Provide easy unsubscribe options',
            '✅ Maintain consistent sending patterns',
            '✅ Keep your contact list clean and updated',
            '✅ Monitor bounce and complaint rates daily',
            warmupStage < 4 && '✅ Respect warmup limits during initial period',
          ].filter(Boolean) as string[]}
        />

        {/* Warmup-specific tips */}
        {warmupStage < 4 && (
          <TipCard
            severity="info"
            title="Warmup Period Tips"
            description="You're in the warmup period. Follow these for best results:"
            tips={[
              '📤 Send to your most engaged contacts first',
              '📊 Maintain high engagement rates (opens, clicks)',
              '⏰ Send at consistent times each day',
              '🎯 Focus on quality over quantity',
              '📈 Gradually increase volume as limits raise',
            ]}
          />
        )}
      </div>
    </Card>
  )
}

// Metric Card Component
function MetricCard({
  name,
  value,
  threshold,
  lower,
  higher,
  isPercentage,
  max,
  icon,
}: {
  name: string
  value: number
  threshold?: { good: number; warning: number }
  lower?: boolean
  higher?: boolean
  isPercentage?: boolean
  max?: number
  icon: React.ReactNode
}) {
  let status: 'good' | 'warning' | 'critical' = 'good'

  if (threshold) {
    if (lower) {
      status = value > threshold.warning ? 'critical' : value > threshold.good ? 'warning' : 'good'
    } else if (higher) {
      status = value < threshold.warning ? 'critical' : value < threshold.good ? 'warning' : 'good'
    }
  }

  const statusColor =
    status === 'good' ? 'text-green-500' : status === 'warning' ? 'text-yellow-500' : 'text-red-500'

  const displayValue = isPercentage ? `${value.toFixed(2)}%` : max ? `${value}/${max}` : value.toString()

  return (
    <div className="rounded-lg border border-purple-500/10 bg-background/30 p-3">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <div className="h-4 w-4">{icon}</div>
        <p className="text-xs">{name}</p>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-xl font-semibold text-foreground">{displayValue}</p>
        {threshold && (
          <div className={statusColor}>
            {status === 'good' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : status === 'warning' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Tip Card Component
function TipCard({
  severity,
  title,
  description,
  tips,
}: {
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  tips: string[]
}) {
  const colors = {
    info: {
      border: 'border-teal-500/30',
      bg: 'bg-teal-500/5',
      icon: 'text-teal-500',
      title: 'text-teal-700',
      text: 'text-teal-600',
    },
    warning: {
      border: 'border-yellow-500/30',
      bg: 'bg-yellow-500/5',
      icon: 'text-yellow-500',
      title: 'text-yellow-700',
      text: 'text-yellow-600',
    },
    critical: {
      border: 'border-red-500/30',
      bg: 'bg-red-500/5',
      icon: 'text-red-500',
      title: 'text-red-700',
      text: 'text-red-600',
    },
  }

  const color = colors[severity]

  const Icon = severity === 'critical' ? XCircle : severity === 'warning' ? AlertTriangle : CheckCircle2

  return (
    <div className={`rounded-lg border ${color.border} ${color.bg} p-4`}>
      <div className="mb-3 flex items-start gap-2">
        <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${color.icon}`} />
        <div>
          <h5 className={`font-semibold ${color.title}`}>{title}</h5>
          <p className={`mt-1 text-sm ${color.text}`}>{description}</p>
        </div>
      </div>
      <ul className={`ml-7 space-y-1 text-sm ${color.text}`}>
        {tips.map((tip, index) => (
          <li key={index}>{tip}</li>
        ))}
      </ul>
    </div>
  )
}
