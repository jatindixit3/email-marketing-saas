// Comprehensive Error Handler for API Routes and Server Actions

import { NextResponse } from 'next/server'
import { ApiError, ErrorResponse } from './api-error'
import { PostgrestError } from '@supabase/supabase-js'

// Map Supabase errors to user-friendly messages
const SUPABASE_ERROR_MESSAGES: Record<string, string> = {
  '23505': 'This record already exists',
  '23503': 'Cannot delete: record is being used elsewhere',
  '42P01': 'Database table not found',
  'PGRST116': 'No rows found',
  'PGRST301': 'Invalid request parameters',
}

// Map common error codes to HTTP status codes
const ERROR_STATUS_MAP: Record<string, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  RATE_LIMIT_EXCEEDED: 429,
  INTERNAL_ERROR: 500,
}

export function handleSupabaseError(error: PostgrestError): ApiError {
  const message = SUPABASE_ERROR_MESSAGES[error.code] || error.message
  const statusCode = error.code === 'PGRST116' ? 404 : 500

  return new ApiError(statusCode, message, error.code, {
    hint: error.hint,
    details: error.details,
  })
}

export function handleError(error: unknown, path?: string): NextResponse<ErrorResponse> {
  console.error('API Error:', error)

  let apiError: ApiError

  if (error instanceof ApiError) {
    apiError = error
  } else if (error && typeof error === 'object' && 'code' in error) {
    // Supabase error
    apiError = handleSupabaseError(error as PostgrestError)
  } else if (error instanceof Error) {
    apiError = new ApiError(500, error.message)
  } else {
    apiError = new ApiError(500, 'An unexpected error occurred')
  }

  const response: ErrorResponse = {
    success: false,
    error: {
      message: apiError.message,
      code: apiError.code,
      statusCode: apiError.statusCode,
      details: apiError.details,
      timestamp: new Date().toISOString(),
      path,
    },
  }

  return NextResponse.json(response, { status: apiError.statusCode })
}

// For server actions (non-API routes)
export function handleServerActionError(error: unknown): ErrorResponse['error'] {
  console.error('Server Action Error:', error)

  if (error instanceof ApiError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      timestamp: new Date().toISOString(),
    }
  }

  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = handleSupabaseError(error as PostgrestError)
    return {
      message: supabaseError.message,
      code: supabaseError.code,
      statusCode: supabaseError.statusCode,
      timestamp: new Date().toISOString(),
    }
  }

  return {
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    statusCode: 500,
    timestamp: new Date().toISOString(),
  }
}
