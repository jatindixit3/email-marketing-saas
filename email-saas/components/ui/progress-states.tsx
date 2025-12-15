// Progress State Components for Uploads and Batch Operations

import * as React from 'react'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, XCircle, Upload, Send, FileDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressStateProps {
  progress: number
  total?: number
  current?: number
  status?: 'uploading' | 'processing' | 'sending' | 'downloading' | 'completed' | 'error'
  message?: string
  error?: string
}

// Upload Progress Component
export function UploadProgress({
  progress,
  total,
  current,
  status = 'uploading',
  message,
  error,
}: ProgressStateProps) {
  const isComplete = status === 'completed'
  const hasError = status === 'error'

  return (
    <div className="space-y-3 rounded-lg border border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {hasError ? (
            <XCircle className="h-5 w-5 text-red-500" />
          ) : isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Upload className="h-5 w-5 text-purple-500 animate-pulse" />
          )}
          <div>
            <p className="font-medium">
              {hasError
                ? 'Upload Failed'
                : isComplete
                ? 'Upload Complete'
                : message || 'Uploading...'}
            </p>
            {current !== undefined && total !== undefined && !isComplete && (
              <p className="text-sm text-muted-foreground">
                {current} of {total} items
              </p>
            )}
          </div>
        </div>
        <span className="text-sm font-semibold text-purple-500">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress Bar */}
      <Progress
        value={progress}
        className={cn(
          'h-2',
          hasError && '[&>div]:bg-red-500',
          isComplete && '[&>div]:bg-green-500'
        )}
      />

      {/* Error Message */}
      {hasError && error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Success Message */}
      {isComplete && (
        <p className="text-sm text-green-600">
          {total ? `Successfully uploaded ${total} items` : 'Upload successful'}
        </p>
      )}
    </div>
  )
}

// Campaign Send Progress
export function SendProgress({
  progress,
  total,
  current,
  status = 'sending',
  message,
}: ProgressStateProps) {
  const isComplete = status === 'completed'

  return (
    <div className="space-y-3 rounded-lg border border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Send className="h-5 w-5 text-purple-500 animate-pulse" />
          )}
          <div>
            <p className="font-medium">
              {isComplete ? 'Campaign Sent!' : message || 'Sending Campaign...'}
            </p>
            {current !== undefined && total !== undefined && !isComplete && (
              <p className="text-sm text-muted-foreground">
                Sent {current.toLocaleString()} of {total.toLocaleString()} emails
              </p>
            )}
          </div>
        </div>
        <span className="text-sm font-semibold text-purple-500">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress Bar */}
      <Progress
        value={progress}
        className={cn('h-2', isComplete && '[&>div]:bg-green-500')}
      />

      {/* Completion Stats */}
      {isComplete && total && (
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Total Sent:</span>
            <span className="ml-2 font-semibold text-green-600">
              {total.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Est. Delivery:</span>
            <span className="ml-2 font-medium">2-5 minutes</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Export Progress
export function ExportProgress({
  progress,
  total,
  status = 'processing',
  message,
}: ProgressStateProps) {
  const isComplete = status === 'completed'

  return (
    <div className="space-y-3 rounded-lg border border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <FileDown className="h-5 w-5 text-purple-500 animate-pulse" />
          )}
          <div>
            <p className="font-medium">
              {isComplete ? 'Export Ready!' : message || 'Exporting...'}
            </p>
            {total !== undefined && !isComplete && (
              <p className="text-sm text-muted-foreground">
                Processing {total.toLocaleString()} contacts
              </p>
            )}
          </div>
        </div>
        <span className="text-sm font-semibold text-purple-500">
          {Math.round(progress)}%
        </span>
      </div>

      <Progress
        value={progress}
        className={cn('h-2', isComplete && '[&>div]:bg-green-500')}
      />

      {isComplete && (
        <p className="text-sm text-green-600">
          Your file is ready to download
        </p>
      )}
    </div>
  )
}

// Inline Progress (compact version)
export function InlineProgress({
  progress,
  message,
  className,
}: {
  progress: number
  message?: string
  className?: string
}) {
  return (
    <div className={cn('space-y-1', className)}>
      {message && (
        <p className="text-xs text-muted-foreground">{message}</p>
      )}
      <div className="flex items-center gap-2">
        <Progress value={progress} className="h-1 flex-1" />
        <span className="text-xs font-medium text-purple-500">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  )
}

// Step Progress (for multi-step forms)
interface StepProgressProps {
  currentStep: number
  totalSteps: number
  steps: string[]
}

export function StepProgress({ currentStep, totalSteps, steps }: StepProgressProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <Progress value={progress} className="h-2" />

      {/* Steps */}
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep

          return (
            <div
              key={step}
              className={cn(
                'flex flex-col items-center gap-2',
                isActive && 'text-purple-500',
                isCompleted && 'text-green-500',
                !isActive && !isCompleted && 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold',
                  isActive && 'border-purple-500 bg-purple-500/10',
                  isCompleted && 'border-green-500 bg-green-500/10',
                  !isActive && !isCompleted && 'border-muted-foreground/30'
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  stepNumber
                )}
              </div>
              <span className="text-xs font-medium">{step}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
