'use client'

// Confetti Animation Component

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiProps {
  trigger?: boolean
  onComplete?: () => void
}

// Basic Confetti Burst
export function Confetti({ trigger = true, onComplete }: ConfettiProps) {
  useEffect(() => {
    if (trigger) {
      const duration = 3000
      const end = Date.now() + duration

      const colors = ['#14b8a6', '#a855f7', '#06b6d4', '#8b5cf6']

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        })
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        } else {
          onComplete?.()
        }
      }

      frame()
    }
  }, [trigger, onComplete])

  return null
}

// Explosion Confetti (for major celebrations)
export function ConfettiExplosion({ trigger = true }: { trigger?: boolean }) {
  useEffect(() => {
    if (trigger) {
      const count = 200
      const defaults = {
        origin: { y: 0.7 },
        colors: ['#14b8a6', '#a855f7', '#06b6d4', '#8b5cf6', '#10b981'],
      }

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        })
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      })

      fire(0.2, {
        spread: 60,
      })

      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      })

      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      })

      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      })
    }
  }, [trigger])

  return null
}

// Realistic Confetti
export function RealisticConfetti({ trigger = true }: { trigger?: boolean }) {
  useEffect(() => {
    if (trigger) {
      const duration = 15 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#14b8a6', '#a855f7', '#06b6d4'],
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#8b5cf6', '#10b981', '#06b6d4'],
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [trigger])

  return null
}

// Stars Animation (subtle celebration)
export function StarsConfetti({ trigger = true }: { trigger?: boolean }) {
  useEffect(() => {
    if (trigger) {
      const defaults = {
        spread: 360,
        ticks: 50,
        gravity: 0,
        decay: 0.94,
        startVelocity: 30,
        colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8'],
      }

      function shoot() {
        confetti({
          ...defaults,
          particleCount: 40,
          scalar: 1.2,
          shapes: ['star'],
        })

        confetti({
          ...defaults,
          particleCount: 10,
          scalar: 0.75,
          shapes: ['circle'],
        })
      }

      setTimeout(shoot, 0)
      setTimeout(shoot, 100)
      setTimeout(shoot, 200)
    }
  }, [trigger])

  return null
}

// Fireworks Animation
export function FireworksConfetti({ trigger = true }: { trigger?: boolean }) {
  useEffect(() => {
    if (trigger) {
      const duration = 5 * 1000
      const animationEnd = Date.now() + duration

      const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        confetti({
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          zIndex: 9999,
          particleCount: 100,
          origin: {
            x: Math.random(),
            y: Math.random() - 0.2,
          },
          colors: ['#14b8a6', '#a855f7', '#06b6d4', '#8b5cf6', '#10b981'],
        })
      }, 400)

      return () => clearInterval(interval)
    }
  }, [trigger])

  return null
}

// School Pride (shoot from bottom)
export function SchoolPrideConfetti({ trigger = true }: { trigger?: boolean }) {
  useEffect(() => {
    if (trigger) {
      const end = Date.now() + 3 * 1000

      const colors = ['#14b8a6', '#a855f7']

      ;(function frame() {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 1 },
          colors: colors,
        })
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 1 },
          colors: colors,
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      })()
    }
  }, [trigger])

  return null
}

// Custom Confetti Trigger Function
export function triggerConfetti(type: 'basic' | 'explosion' | 'realistic' | 'stars' | 'fireworks' = 'basic') {
  const colors = ['#14b8a6', '#a855f7', '#06b6d4', '#8b5cf6', '#10b981']

  switch (type) {
    case 'explosion':
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors,
      })
      break

    case 'realistic':
      const duration = 5 * 1000
      const end = Date.now() + duration

      ;(function frame() {
        confetti({
          particleCount: 7,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        })
        confetti({
          particleCount: 7,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      })()
      break

    case 'stars':
      confetti({
        particleCount: 50,
        spread: 360,
        ticks: 50,
        gravity: 0,
        decay: 0.94,
        startVelocity: 30,
        shapes: ['star'],
        colors: ['#FFE400', '#FFBD00', '#E89400'],
      })
      break

    case 'fireworks':
      confetti({
        particleCount: 150,
        spread: 360,
        origin: { x: 0.5, y: 0.5 },
        colors: colors,
      })
      break

    default:
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors,
      })
  }
}
