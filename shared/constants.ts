export const CONTENT_STATUSES = ['DRAFT', 'PUBLISHED', 'SCHEDULED'] as const

export type ContentStatus = (typeof CONTENT_STATUSES)[number]

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  SCHEDULED: '定时发布',
}

export const PAGE_SIZE_DEFAULT = 12
export const PAGE_SIZE_MAX = 50

export const SITE_TIME_ZONE = 'Asia/Shanghai'
export const READING_WORDS_PER_MINUTE = 300
export const SITE_NAME_FALLBACK = '星屿 Astra'

export const SESSION_COOKIE_NAME = 'astra_session'
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60
export const REMEMBER_TTL_SECONDS = 30 * 24 * 60 * 60

export const LOGIN_MAX_ATTEMPTS = 5
export const LOGIN_WINDOW_MINUTES = 15

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
] as const

export const ADMIN_SESSION_LIMIT = 20

export const API_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  STALE_CONTENT: 'STALE_CONTENT',
  RATE_LIMITED: 'RATE_LIMITED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES]
