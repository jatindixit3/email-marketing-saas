// Standardized API Error Types and Response Formats

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Standard error response format
export interface ErrorResponse {
  success: false
  error: {
    message: string
    code?: string
    statusCode: number
    details?: Record<string, any>
    timestamp: string
    path?: string
  }
}

// Standard success response format
export interface SuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse
