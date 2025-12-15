// Form-Specific Validation Functions

import { validators, ValidationResult, sanitize } from './validators'

// Campaign form validation
export function validateCampaignForm(data: {
  name: string
  subject: string
  body_html?: string
  list_ids?: string[]
}): ValidationResult {
  const errors: Record<string, string> = {}

  // Name validation
  const nameError =
    validators.required(data.name, 'Campaign name') ||
    validators.minLength(data.name, 3, 'Campaign name') ||
    validators.maxLength(data.name, 100, 'Campaign name')
  if (nameError) errors.name = nameError

  // Subject validation
  const subjectError =
    validators.required(data.subject, 'Subject line') ||
    validators.minLength(data.subject, 5, 'Subject line') ||
    validators.maxLength(data.subject, 200, 'Subject line')
  if (subjectError) errors.subject = subjectError

  // List IDs validation
  if (data.list_ids && data.list_ids.length === 0) {
    errors.list_ids = 'Please select at least one contact list'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

// Contact form validation
export function validateContactForm(data: {
  email: string
  first_name?: string
  last_name?: string
  metadata?: Record<string, any>
}): ValidationResult {
  const errors: Record<string, string> = {}

  // Email validation
  const emailError =
    validators.required(data.email, 'Email') || validators.email(data.email)
  if (emailError) errors.email = emailError

  // First name validation (optional but if provided)
  if (data.first_name) {
    const nameError = validators.maxLength(data.first_name, 50, 'First name')
    if (nameError) errors.first_name = nameError
  }

  // Last name validation (optional but if provided)
  if (data.last_name) {
    const nameError = validators.maxLength(data.last_name, 50, 'Last name')
    if (nameError) errors.last_name = nameError
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

// Contact list form validation
export function validateListForm(data: { name: string; description?: string }): ValidationResult {
  const errors: Record<string, string> = {}

  const nameError =
    validators.required(data.name, 'List name') ||
    validators.minLength(data.name, 2, 'List name') ||
    validators.maxLength(data.name, 50, 'List name')
  if (nameError) errors.name = nameError

  if (data.description) {
    const descError = validators.maxLength(data.description, 200, 'Description')
    if (descError) errors.description = descError
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

// Template form validation
export function validateTemplateForm(data: {
  name: string
  html_content: string
  category?: string
}): ValidationResult {
  const errors: Record<string, string> = {}

  const nameError =
    validators.required(data.name, 'Template name') ||
    validators.maxLength(data.name, 100, 'Template name')
  if (nameError) errors.name = nameError

  const htmlError = validators.required(data.html_content, 'Template content')
  if (htmlError) errors.html_content = htmlError

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

// User profile validation
export function validateUserProfileForm(data: {
  first_name?: string
  last_name?: string
  company?: string
}): ValidationResult {
  const errors: Record<string, string> = {}

  if (data.first_name) {
    const error = validators.maxLength(data.first_name, 50, 'First name')
    if (error) errors.first_name = error
  }

  if (data.last_name) {
    const error = validators.maxLength(data.last_name, 50, 'Last name')
    if (error) errors.last_name = error
  }

  if (data.company) {
    const error = validators.maxLength(data.company, 100, 'Company')
    if (error) errors.company = error
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
