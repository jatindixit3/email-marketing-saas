// Example Form Component with Validation and Error Handling

'use client'

import { useState } from 'react'
import { useFormValidation } from '@/hooks/use-form-validation'
import { validateCampaignForm } from '@/lib/validation/forms'
import { sanitize } from '@/lib/validation/validators'

export function ExampleCampaignForm() {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body_html: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const { errors, validate, validateField, getFieldError } =
    useFormValidation(validateCampaignForm)

  const handleChange = (field: string, value: string) => {
    const sanitizedValue = sanitize.string(value)
    const newData = { ...formData, [field]: sanitizedValue }
    setFormData(newData)

    // Real-time validation on blur
    validateField(newData, field as keyof typeof formData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError('')
    setSuccessMessage('')

    // Validate all fields
    if (!validate(formData)) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!data.success) {
        // Handle API error
        setApiError(data.error.message)

        // Handle validation errors from server
        if (data.error.details?.errors) {
          // Display server-side validation errors
          console.error('Validation errors:', data.error.details.errors)
        }
        return
      }

      // Success
      setSuccessMessage(data.message || 'Campaign created successfully')

      // Reset form
      setTimeout(() => {
        window.location.href = '/dashboard/campaigns'
      }, 1500)
    } catch (error) {
      setApiError('Failed to create campaign. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* API Error Alert */}
      {apiError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-red-400">{apiError}</p>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-sm text-green-400">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Campaign Name Field */}
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium text-gray-300"
        >
          Campaign Name <span className="text-red-400">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={() => validateField(formData, 'name')}
          className={`w-full rounded-lg border px-4 py-2 text-white transition-all focus:outline-none focus:ring-2 ${
            getFieldError('name')
              ? 'border-red-500 bg-red-500/10 focus:ring-red-400/20'
              : 'border-purple-500/20 bg-black/40 focus:border-teal-400 focus:ring-teal-400/20'
          }`}
          required
          minLength={3}
          maxLength={100}
          placeholder="e.g., Summer Sale 2025"
        />
        {getFieldError('name') && (
          <p className="mt-1 text-sm text-red-400">{getFieldError('name')}</p>
        )}
      </div>

      {/* Subject Line Field */}
      <div>
        <label
          htmlFor="subject"
          className="mb-2 block text-sm font-medium text-gray-300"
        >
          Subject Line <span className="text-red-400">*</span>
        </label>
        <input
          id="subject"
          type="text"
          value={formData.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          onBlur={() => validateField(formData, 'subject')}
          className={`w-full rounded-lg border px-4 py-2 text-white transition-all focus:outline-none focus:ring-2 ${
            getFieldError('subject')
              ? 'border-red-500 bg-red-500/10 focus:ring-red-400/20'
              : 'border-purple-500/20 bg-black/40 focus:border-teal-400 focus:ring-teal-400/20'
          }`}
          required
          minLength={5}
          maxLength={200}
          placeholder="e.g., 50% Off Everything - Limited Time!"
        />
        {getFieldError('subject') && (
          <p className="mt-1 text-sm text-red-400">{getFieldError('subject')}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {formData.subject.length}/200 characters
        </p>
      </div>

      {/* Email Body Field */}
      <div>
        <label
          htmlFor="body_html"
          className="mb-2 block text-sm font-medium text-gray-300"
        >
          Email Body
        </label>
        <textarea
          id="body_html"
          value={formData.body_html}
          onChange={(e) => handleChange('body_html', e.target.value)}
          rows={8}
          className="w-full rounded-lg border border-purple-500/20 bg-black/40 px-4 py-2 text-white transition-all focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
          placeholder="Email content..."
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 px-6 py-3 font-medium text-white transition-all hover:from-teal-600 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-5 w-5 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Creating...
          </span>
        ) : (
          'Create Campaign'
        )}
      </button>
    </form>
  )
}
