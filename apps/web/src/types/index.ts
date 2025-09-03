// Re-export all types for easy importing
export * from './artist'
export * from './api'

// Common utility types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export interface ApiResponseWithPagination<T = any> extends ApiResponse<T> {
  data: {
    items: T[]
    pagination: PaginationInfo
  }
}

// Form types
export interface FormState {
  loading: boolean
  error: string | null
  success: boolean
}

// Common component props
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}