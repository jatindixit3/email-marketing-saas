// Success State Components

import * as React from 'react'
import { CheckCircle2, Mail, Users, FileCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SuccessStateProps {
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  stats?: Array<{ label: string; value: string }>
  className?: string
}

// Generic Success State
export function SuccessState({
  title,
  description,
  action,
  secondaryAction,
  stats,
  className,
}: SuccessStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-green-500/20 bg-gradient-to-br from-green-500/5 to-teal-500/5 p-12 text-center',
        className
      )}
    >
      {/* Success Icon with animation */}
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20 opacity-75"></div>
        <div className="relative rounded-full bg-gradient-to-r from-green-500/10 to-teal-500/10 p-6">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
      </div>

      {/* Content */}
      <h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">{description}</p>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <div className="mb-6 flex gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-2xl font-bold text-green-600">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {action && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={action.onClick}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
          >
            {action.label}
          </Button>
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="outline" size="lg">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Campaign Sent Success
export function CampaignSentSuccess({
  recipientCount,
  onViewAnalytics,
  onCreateAnother,
}: {
  recipientCount: number
  onViewAnalytics: () => void
  onCreateAnother: () => void
}) {
  return (
    <SuccessState
      title="Campaign Sent Successfully! 🎉"
      description={`Your campaign has been sent to ${recipientCount.toLocaleString()} recipients. Track performance in real-time from the analytics dashboard.`}
      stats={[
        { label: 'Recipients', value: recipientCount.toLocaleString() },
        { label: 'Est. Delivery', value: '2-5 min' },
      ]}
      action={{
        label: '📊 View Analytics',
        onClick: onViewAnalytics,
      }}
      secondaryAction={{
        label: 'Create Another Campaign',
        onClick: onCreateAnother,
      }}
    />
  )
}

// Contacts Imported Success
export function ContactsImportedSuccess({
  importedCount,
  skippedCount,
  onViewContacts,
  onImportMore,
}: {
  importedCount: number
  skippedCount: number
  onViewContacts: () => void
  onImportMore: () => void
}) {
  return (
    <SuccessState
      title="Contacts Imported Successfully!"
      description={`${importedCount.toLocaleString()} contacts have been added to your list${
        skippedCount > 0 ? `. ${skippedCount} duplicates were skipped.` : '.'
      }`}
      stats={[
        { label: 'Imported', value: importedCount.toLocaleString() },
        { label: 'Skipped', value: skippedCount.toLocaleString() },
      ]}
      action={{
        label: '👥 View Contacts',
        onClick: onViewContacts,
      }}
      secondaryAction={{
        label: 'Import More',
        onClick: onImportMore,
      }}
    />
  )
}

// Template Saved Success (Compact)
export function TemplateSavedSuccess({ onClose }: { onClose: () => void }) {
  return (
    <div className="rounded-lg border border-green-500/20 bg-gradient-to-br from-green-500/5 to-teal-500/5 p-6">
      <div className="flex items-start gap-4">
        <CheckCircle2 className="h-6 w-6 text-green-500" />
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">Template Saved!</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Your template has been saved and is ready to use in campaigns.
          </p>
        </div>
        <Button onClick={onClose} variant="ghost" size="sm">
          Close
        </Button>
      </div>
    </div>
  )
}

// First Campaign Success with Confetti Trigger
export function FirstCampaignSuccess({
  onViewAnalytics,
  onLearnMore,
}: {
  onViewAnalytics: () => void
  onLearnMore: () => void
}) {
  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center rounded-lg border border-green-500/20 bg-gradient-to-br from-green-500/5 via-teal-500/5 to-purple-500/5 p-12 text-center">
      {/* Animated Success Icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-ping rounded-full bg-gradient-to-r from-green-500/20 to-purple-500/20 opacity-75"></div>
        <div className="relative animate-bounce rounded-full bg-gradient-to-r from-green-500/10 to-purple-500/10 p-8">
          <Sparkles className="h-16 w-16 text-purple-500" />
        </div>
      </div>

      {/* Content */}
      <h2 className="mb-3 bg-gradient-to-r from-green-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
        Congratulations! 🎉
      </h2>
      <h3 className="mb-3 text-xl font-semibold text-foreground">
        You've sent your first campaign!
      </h3>
      <p className="mb-8 max-w-md text-sm text-muted-foreground">
        This is an exciting milestone! Your campaign is now being delivered to your audience.
        Track opens, clicks, and engagement in real-time.
      </p>

      {/* Milestone Badge */}
      <div className="mb-8 rounded-full border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-6 py-2">
        <p className="text-sm font-semibold text-purple-600">
          ✨ Milestone Unlocked: First Campaign
        </p>
      </div>

      {/* Next Steps */}
      <div className="mb-8 w-full max-w-md rounded-lg border border-purple-500/20 bg-background/50 p-6 text-left">
        <h4 className="mb-3 text-sm font-semibold text-foreground">What's Next?</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
            <span>Monitor real-time analytics and engagement</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
            <span>Set up email tracking for detailed insights</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
            <span>Create templates for faster future campaigns</span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={onViewAnalytics}
          size="lg"
          className="bg-gradient-to-r from-green-500 to-purple-500 hover:from-green-600 hover:to-purple-600"
        >
          📊 View Campaign Analytics
        </Button>
        <Button onClick={onLearnMore} variant="outline" size="lg">
          Learn Best Practices
        </Button>
      </div>
    </div>
  )
}

// Inline Success Message
export function InlineSuccessMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-sm text-green-700">
      <CheckCircle2 className="h-4 w-4" />
      <span>{message}</span>
    </div>
  )
}
