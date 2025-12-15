'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

/**
 * Cookie Consent Banner Component
 * EU Cookie Law & GDPR Compliant
 */

interface CookiePreferences {
  essential: boolean // Always true
  functional: boolean
  analytics: boolean
  marketing: boolean
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie_consent')

    if (!consent) {
      // Show banner after a short delay
      setTimeout(() => setShowBanner(true), 1000)
    } else {
      // Load saved preferences
      try {
        const saved = JSON.parse(consent)
        setPreferences(saved)
        applyConsent(saved)
      } catch (error) {
        console.error('Failed to parse cookie consent:', error)
      }
    }
  }, [])

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie_consent', JSON.stringify(prefs))
    localStorage.setItem('cookie_consent_date', new Date().toISOString())

    // Also save in a cookie for server-side access
    document.cookie = `cookie_consent=${JSON.stringify(prefs)}; max-age=31536000; path=/; SameSite=Lax`

    applyConsent(prefs)
    setShowBanner(false)
    setShowSettings(false)
  }

  const applyConsent = (prefs: CookiePreferences) => {
    // Apply analytics consent
    if (prefs.analytics) {
      enableGoogleAnalytics()
    } else {
      disableGoogleAnalytics()
    }

    // Apply marketing consent
    if (prefs.marketing) {
      enableMarketingCookies()
    } else {
      disableMarketingCookies()
    }

    // Functional cookies are handled by the app
    if (prefs.functional) {
      enableFunctionalCookies()
    }
  }

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    }
    saveConsent(allAccepted)
  }

  const handleRejectAll = () => {
    saveConsent(DEFAULT_PREFERENCES)
  }

  const handleSavePreferences = () => {
    saveConsent(preferences)
  }

  if (!showBanner) {
    return null
  }

  return (
    <>
      {/* Banner Overlay */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />

      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-2xl border border-gray-200">
          {/* Settings View */}
          {showSettings ? (
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Cookie Preferences
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close settings"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                We use cookies to enhance your experience. Choose which cookies you'd
                like to accept.
              </p>

              {/* Cookie Categories */}
              <div className="space-y-4">
                {/* Essential Cookies */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">
                          Essential Cookies
                        </h4>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          Required
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        These cookies are necessary for the website to function and
                        cannot be disabled. They include session management,
                        authentication, and security features.
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled
                        className="w-5 h-5 text-blue-600 rounded cursor-not-allowed opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        Functional Cookies
                      </h4>
                      <p className="text-sm text-gray-600">
                        These cookies enable enhanced functionality and personalization,
                        such as remembering your preferences (theme, language, timezone).
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            functional: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        Analytics Cookies
                      </h4>
                      <p className="text-sm text-gray-600">
                        These cookies help us understand how visitors interact with our
                        website by collecting and reporting information anonymously.
                        We use Google Analytics.
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            analytics: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        Marketing Cookies
                      </h4>
                      <p className="text-sm text-gray-600">
                        These cookies are used to track visitors across websites to
                        display relevant ads and measure the effectiveness of advertising
                        campaigns.
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            marketing: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Save Preferences
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Read our{' '}
                <Link
                  href="/legal/cookie-policy"
                  className="text-blue-600 hover:underline"
                >
                  Cookie Policy
                </Link>{' '}
                for more information.
              </p>
            </div>
          ) : (
            /* Simple Banner View */
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    We value your privacy
                  </h3>
                  <p className="text-sm text-gray-600">
                    We use cookies to enhance your browsing experience, serve
                    personalized content, and analyze our traffic. By clicking "Accept
                    All", you consent to our use of cookies.{' '}
                    <Link
                      href="/legal/cookie-policy"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Learn more
                    </Link>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    Customize
                  </button>
                  <button
                    onClick={handleRejectAll}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    Reject All
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/**
 * Helper Functions for Cookie Management
 */

function enableGoogleAnalytics() {
  // Load Google Analytics
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_ID) {
    // @ts-ignore
    window.dataLayer = window.dataLayer || []
    // @ts-ignore
    function gtag() {
      // @ts-ignore
      dataLayer.push(arguments)
    }
    // @ts-ignore
    gtag('js', new Date())
    // @ts-ignore
    gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      anonymize_ip: true, // GDPR compliance
    })

    // Load GA script
    const script = document.createElement('script')
    script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`
    script.async = true
    document.head.appendChild(script)
  }
}

function disableGoogleAnalytics() {
  // Disable Google Analytics
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window['ga-disable-' + process.env.NEXT_PUBLIC_GA_ID] = true
  }
}

function enableMarketingCookies() {
  // Enable marketing pixels (Facebook, etc.)
  // Add your marketing pixel code here
  console.log('Marketing cookies enabled')
}

function disableMarketingCookies() {
  // Disable marketing pixels
  console.log('Marketing cookies disabled')
}

function enableFunctionalCookies() {
  // Functional cookies are managed by the application
  console.log('Functional cookies enabled')
}

/**
 * Cookie Settings Link Component
 * Place this in your footer
 */
export function CookieSettingsLink() {
  const [, setShow] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()

    // Remove consent to show banner again
    localStorage.removeItem('cookie_consent')

    // Reload page to show banner
    window.location.reload()
  }

  return (
    <button
      onClick={handleClick}
      className="text-sm text-gray-600 hover:text-gray-900 underline"
    >
      Cookie Settings
    </button>
  )
}
