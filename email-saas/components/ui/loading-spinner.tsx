// Loading Spinner Components

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
}

// Basic Spinner
export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-purple-500', sizeClasses[size], className)}
    />
  )
}

// Button Spinner (for inline use in buttons)
export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn('mr-2 h-4 w-4 animate-spin', className)}
    />
  )
}

// Full Page Spinner
export function PageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-purple-500" />
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

// Card Spinner (for loading states in cards)
export function CardSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-500" />
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

// Inline Spinner (for inline text)
export function InlineSpinner() {
  return (
    <Loader2 className="inline-block h-4 w-4 animate-spin text-purple-500" />
  )
}

// Overlay Spinner (for loading over content)
export function OverlaySpinner({ message }: { message?: string }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-purple-500" />
        {message && (
          <p className="mt-3 text-sm font-medium text-foreground">{message}</p>
        )}
      </div>
    </div>
  )
}

// Dots Spinner (alternative style)
export function DotsSpinner() {
  return (
    <div className="flex items-center gap-1">
      <div className="h-2 w-2 animate-bounce rounded-full bg-purple-500 [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 animate-bounce rounded-full bg-purple-500 [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 animate-bounce rounded-full bg-purple-500"></div>
    </div>
  )
}

// Pulse Spinner (for subtle loading)
export function PulseSpinner() {
  return (
    <div className="relative h-10 w-10">
      <div className="absolute inset-0 animate-ping rounded-full bg-purple-500 opacity-75"></div>
      <div className="relative h-10 w-10 rounded-full bg-purple-500"></div>
    </div>
  )
}
