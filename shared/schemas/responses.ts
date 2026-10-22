import type { AuthUser } from './entities'

export type PaginatedMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type ApiSuccess<T> = { data: T }

export type ApiErrorBody = {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type Paginated<T> = {
  data: T[]
  meta: PaginatedMeta
}

export type AuthMeResponse = { user: AuthUser }
