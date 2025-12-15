// Client-Side Form Validation Hook

'use client'

import { useState } from 'react'
import { ValidationResult } from '@/lib/validation/validators'

export function useFormValidation<T extends Record<string, any>>(
  validateFn: (data: T) => ValidationResult
) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validate = (data: T): boolean => {
    const result = validateFn(data)
    setErrors(result.errors)
    return result.valid
  }

  const validateField = (data: T, fieldName: keyof T) => {
    const result = validateFn(data)
    setErrors((prev) => ({
      ...prev,
      [fieldName]: result.errors[fieldName as string] || '',
    }))
    setTouched((prev) => ({
      ...prev,
      [fieldName]: true,
    }))
  }

  const clearError = (fieldName: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }

  const clearAllErrors = () => {
    setErrors({})
    setTouched({})
  }

  const getFieldError = (fieldName: string): string | undefined => {
    return touched[fieldName] ? errors[fieldName] : undefined
  }

  return {
    errors,
    touched,
    validate,
    validateField,
    clearError,
    clearAllErrors,
    getFieldError,
  }
}
