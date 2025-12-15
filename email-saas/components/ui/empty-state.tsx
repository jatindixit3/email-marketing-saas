// Empty State Components

import * as React from 'react'
import { LucideIcon, Mail, Users, FileText, Search, Inbox, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
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
  className?: string
}

// Generic Empty State
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-purple-500/30 bg-gradient-to-br from-teal-500/5 to-purple-500/5 p-12 text-center',
        className
      )}
    >
      {/* Icon with gradient background */}
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-teal-500/20 to-purple-500/20 blur-xl"></div>
        <div className="relative rounded-full bg-gradient-to-r from-teal-500/10 to-purple-500/10 p-6">
          <Icon className="h-12 w-12 text-purple-500" />
        </div>
      </div>

      {/* Content */}
      <h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">{description}</p>

      {/* Actions */}
      {action && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={action.onClick}
            size="lg"
            className="bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600"
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

// No Campaigns Empty State
export function NoCampaignsEmptyState({ onCreateCampaign }: { onCreateCampaign: () => void }) {
  return (
    <EmptyState
      icon={Mail}
      title="No campaigns yet"
      description="Create your first email campaign to start engaging with your audience. Choose from our templates or build from scratch."
      action={{
        label: '✨ Create First Campaign',
        onClick: onCreateCampaign,
      }}
      secondaryAction={{
        label: 'Browse Templates',
        onClick: () => (window.location.href = '/dashboard/templates'),
      }}
    />
  )
}

// No Contacts Empty State
export function NoContactsEmptyState({
  onImport,
  onAddManually,
}: {
  onImport: () => void
  onAddManually: () => void
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-purple-500/30 bg-gradient-to-br from-teal-500/5 to-purple-500/5 p-12 text-center">
      {/* Icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-teal-500/20 to-purple-500/20 blur-xl"></div>
        <div className="relative rounded-full bg-gradient-to-r from-teal-500/10 to-purple-500/10 p-6">
          <Users className="h-12 w-12 text-purple-500" />
        </div>
      </div>

      {/* Content */}
      <h3 className="mb-2 text-xl font-semibold text-foreground">No contacts yet</h3>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        Start building your audience by importing contacts from a CSV file or adding them manually.
      </p>

      {/* Import Guide */}
      <div className="mb-6 max-w-lg rounded-lg border border-purple-500/20 bg-background/50 p-4 text-left">
        <h4 className="mb-2 text-sm font-semibold text-foreground">Import Guide:</h4>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-purple-500">•</span>
            <span>CSV file with columns: email, first_name, last_name (optional)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500">•</span>
            <span>Maximum file size: 10MB</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500">•</span>
            <span>Duplicate emails will be automatically skipped</span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={onImport}
          size="lg"
          className="bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600"
        >
          📤 Import from CSV
        </Button>
        <Button onClick={onAddManually} variant="outline" size="lg">
          ➕ Add Manually
        </Button>
      </div>
    </div>
  )
}

// No Templates Empty State
export function NoTemplatesEmptyState({ onCreateTemplate }: { onCreateTemplate: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No templates saved"
      description="Save time by creating reusable email templates. Design once, use multiple times across your campaigns."
      action={{
        label: '🎨 Create First Template',
        onClick: onCreateTemplate,
      }}
    />
  )
}

// No Search Results Empty State
export function NoSearchResultsEmptyState({
  query,
  onClear,
}: {
  query: string
  onClear: () => void
}) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-purple-500/20 p-12 text-center">
      {/* Icon */}
      <Search className="mb-4 h-10 w-10 text-muted-foreground/50" />

      {/* Content */}
      <h3 className="mb-2 text-lg font-semibold text-foreground">No results found</h3>
      <p className="mb-4 max-w-sm text-sm text-muted-foreground">
        We couldn't find anything matching{' '}
        <span className="font-semibold text-foreground">"{query}"</span>
      </p>

      {/* Suggestions */}
      <div className="mb-6 text-xs text-muted-foreground">
        <p className="mb-1">Try:</p>
        <ul className="space-y-1">
          <li>• Checking your spelling</li>
          <li>• Using different keywords</li>
          <li>• Using more general terms</li>
        </ul>
      </div>

      <Button onClick={onClear} variant="outline">
        Clear Search
      </Button>
    </div>
  )
}

// No Lists Empty State
export function NoListsEmptyState({ onCreateList }: { onCreateList: () => void }) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="No lists yet"
      description="Organize your contacts into lists for better segmentation and targeted campaigns."
      action={{
        label: '📋 Create First List',
        onClick: onCreateList,
      }}
    />
  )
}

// Generic No Data State (compact version)
export function NoDataState({
  icon: Icon = Inbox,
  message = 'No data available',
  className,
}: {
  icon?: LucideIcon
  message?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed border-purple-500/20 p-8 text-center',
        className
      )}
    >
      <Icon className="mb-3 h-8 w-8 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

// No Analytics Data
export function NoAnalyticsEmptyState() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5 p-12 text-center">
      <div className="relative mb-4">
        <div className="rounded-full bg-gradient-to-r from-teal-500/10 to-purple-500/10 p-4">
          <Mail className="h-10 w-10 text-purple-500" />
        </div>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">No analytics data yet</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        Send your first campaign to start tracking opens, clicks, and engagement metrics.
      </p>
    </div>
  )
}
