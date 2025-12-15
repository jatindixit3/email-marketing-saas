'use client'

// Example Page Demonstrating All Campaign UX States

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  CampaignTableSkeleton,
  AnalyticsSkeleton,
} from '@/components/ui/loading-skeleton'
import { PageSpinner, CardSpinner, OverlaySpinner } from '@/components/ui/loading-spinner'
import { LoadingButton } from '@/components/ui/loading-button'
import { UploadProgress, SendProgress, StepProgress } from '@/components/ui/progress-states'
import {
  NoCampaignsEmptyState,
  NoSearchResultsEmptyState,
  NoAnalyticsEmptyState,
} from '@/components/ui/empty-state'
import {
  CampaignSentSuccess,
  FirstCampaignSuccess,
  InlineSuccessMessage,
} from '@/components/ui/success-state'
import {
  Confetti,
  ConfettiExplosion,
  FireworksConfetti,
  triggerConfetti,
} from '@/components/ui/confetti'
import { toastSuccess, toastError, toastPromise } from '@/lib/utils/toast-helpers'
import { Toaster } from '@/components/ui/toaster'

export default function CampaignStatesExample() {
  const [activeState, setActiveState] = useState<string>('empty')
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [sendProgress, setSendProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(1)
  const [showConfetti, setShowConfetti] = useState(false)
  const [confettiType, setConfettiType] = useState<'basic' | 'explosion' | 'fireworks'>('basic')

  // Simulate progress
  const simulateUploadProgress = () => {
    setUploadProgress(0)
    setActiveState('uploading')
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const simulateSendProgress = () => {
    setSendProgress(0)
    setActiveState('sending')
    const interval = setInterval(() => {
      setSendProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => setActiveState('sent-success'), 500)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const simulateStepProgress = () => {
    setCurrentStep(1)
    setActiveState('steps')
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= 4) {
          clearInterval(interval)
          return 4
        }
        return prev + 1
      })
    }, 1500)
  }

  const showToastExample = async () => {
    await toastPromise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Sending campaign...',
        success: 'Campaign sent to 1,500 recipients!',
        error: 'Failed to send campaign',
      }
    )
  }

  const triggerConfettiAnimation = (type: 'basic' | 'explosion' | 'fireworks') => {
    setConfettiType(type)
    setShowConfetti(false)
    setTimeout(() => setShowConfetti(true), 100)
  }

  return (
    <div className="space-y-6 p-8">
      {/* Page Header */}
      <div>
        <h1 className="mb-2 text-3xl font-bold">Campaign UX States Demo</h1>
        <p className="text-muted-foreground">
          Explore all loading, empty, and success states for the campaign system
        </p>
      </div>

      {/* State Controls */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">State Controls</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setActiveState('empty')} variant="outline">
            Empty State
          </Button>
          <Button onClick={() => setActiveState('loading-table')} variant="outline">
            Loading Table
          </Button>
          <Button onClick={() => setActiveState('loading-analytics')} variant="outline">
            Loading Analytics
          </Button>
          <Button onClick={() => setActiveState('loading-page')} variant="outline">
            Loading Page
          </Button>
          <Button onClick={() => setActiveState('loading-card')} variant="outline">
            Loading Card
          </Button>
          <Button onClick={simulateUploadProgress} variant="outline">
            Upload Progress
          </Button>
          <Button onClick={simulateSendProgress} variant="outline">
            Send Progress
          </Button>
          <Button onClick={simulateStepProgress} variant="outline">
            Step Progress
          </Button>
          <Button onClick={() => setActiveState('no-results')} variant="outline">
            No Results
          </Button>
          <Button onClick={() => setActiveState('sent-success')} variant="outline">
            Sent Success
          </Button>
          <Button onClick={() => setActiveState('first-campaign')} variant="outline">
            First Campaign
          </Button>
          <Button onClick={showToastExample} variant="outline">
            Toast Example
          </Button>
        </div>

        <div className="mt-4 border-t pt-4">
          <h3 className="mb-3 text-sm font-semibold">Confetti Animations</h3>
          <div className="flex gap-3">
            <Button
              onClick={() => triggerConfettiAnimation('basic')}
              variant="outline"
              size="sm"
            >
              Basic Confetti
            </Button>
            <Button
              onClick={() => triggerConfettiAnimation('explosion')}
              variant="outline"
              size="sm"
            >
              Explosion
            </Button>
            <Button
              onClick={() => triggerConfettiAnimation('fireworks')}
              variant="outline"
              size="sm"
            >
              Fireworks
            </Button>
            <Button onClick={() => triggerConfetti('stars')} variant="outline" size="sm">
              Stars
            </Button>
          </div>
        </div>

        <div className="mt-4 border-t pt-4">
          <h3 className="mb-3 text-sm font-semibold">Toast Notifications</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => toastSuccess.campaignSent(1500)}
              variant="outline"
              size="sm"
            >
              Success Toast
            </Button>
            <Button
              onClick={() => toastError.campaignSendFailed('Network error')}
              variant="outline"
              size="sm"
            >
              Error Toast
            </Button>
            <Button onClick={() => setLoading(!loading)} variant="outline" size="sm">
              Toggle Button Loading
            </Button>
          </div>
        </div>
      </Card>

      {/* State Display Area */}
      <Card className="min-h-[500px] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Current State: {activeState}</h2>
          <LoadingButton loading={loading} onClick={() => setLoading(!loading)}>
            {loading ? 'Loading...' : 'Click to Load'}
          </LoadingButton>
        </div>

        {/* Empty States */}
        {activeState === 'empty' && (
          <NoCampaignsEmptyState
            onCreateCampaign={() => alert('Create campaign clicked!')}
          />
        )}

        {activeState === 'no-results' && (
          <NoSearchResultsEmptyState
            query="newsletter template"
            onClear={() => setActiveState('empty')}
          />
        )}

        {activeState === 'no-analytics' && <NoAnalyticsEmptyState />}

        {/* Loading States */}
        {activeState === 'loading-table' && <CampaignTableSkeleton />}

        {activeState === 'loading-analytics' && <AnalyticsSkeleton />}

        {activeState === 'loading-page' && (
          <div className="min-h-[400px]">
            <PageSpinner />
          </div>
        )}

        {activeState === 'loading-card' && <CardSpinner message="Loading campaign data..." />}

        {/* Progress States */}
        {activeState === 'uploading' && (
          <UploadProgress
            progress={uploadProgress}
            total={100}
            current={uploadProgress}
            status={uploadProgress === 100 ? 'completed' : 'uploading'}
            message="Uploading contacts..."
          />
        )}

        {activeState === 'sending' && (
          <SendProgress
            progress={sendProgress}
            total={1500}
            current={Math.floor((sendProgress / 100) * 1500)}
            status={sendProgress === 100 ? 'completed' : 'sending'}
          />
        )}

        {activeState === 'steps' && (
          <StepProgress
            currentStep={currentStep}
            totalSteps={4}
            steps={['Details', 'Recipients', 'Design', 'Review']}
          />
        )}

        {/* Success States */}
        {activeState === 'sent-success' && (
          <>
            <CampaignSentSuccess
              recipientCount={1500}
              onViewAnalytics={() => alert('View analytics clicked!')}
              onCreateAnother={() => alert('Create another clicked!')}
            />
            <div className="mt-4">
              <InlineSuccessMessage message="Campaign queued successfully!" />
            </div>
          </>
        )}

        {activeState === 'first-campaign' && (
          <FirstCampaignSuccess
            onViewAnalytics={() => alert('View analytics clicked!')}
            onLearnMore={() => alert('Learn more clicked!')}
          />
        )}

        {/* Overlay Example */}
        {activeState === 'overlay' && (
          <div className="relative min-h-[400px] rounded-lg border border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5 p-8">
            <h3 className="text-xl font-semibold">Campaign Details</h3>
            <p className="mt-2 text-muted-foreground">
              This content is being overlaid with a loading state...
            </p>
            <OverlaySpinner message="Updating campaign..." />
          </div>
        )}
      </Card>

      {/* Confetti Components */}
      {showConfetti && confettiType === 'basic' && <Confetti trigger={true} />}
      {showConfetti && confettiType === 'explosion' && <ConfettiExplosion trigger={true} />}
      {showConfetti && confettiType === 'fireworks' && <FireworksConfetti trigger={true} />}

      {/* Toast Container */}
      <Toaster />
    </div>
  )
}
