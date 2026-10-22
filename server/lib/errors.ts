import { API_ERROR_CODES, type ApiErrorCode } from '../../shared/constants'

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  STALE_CONTENT: 409,
  RATE_LIMITED: 429,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  INTERNAL_ERROR: 500,
}

export class AppError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly details?: unknown

  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = STATUS_BY_CODE[code]
    this.details = details
  }
}

export const badRequest = (message: string, details?: unknown): AppError =>
  new AppError(API_ERROR_CODES.VALIDATION_ERROR, message, details)

export const unauthorized = (message = '未登录或会话已过期'): AppError =>
  new AppError(API_ERROR_CODES.UNAUTHORIZED, message)

export const forbidden = (message = '没有权限执行该操作'): AppError =>
  new AppError(API_ERROR_CODES.FORBIDDEN, message)

export const notFound = (message = '资源不存在'): AppError =>
  new AppError(API_ERROR_CODES.NOT_FOUND, message)

export const conflict = (message: string, details?: unknown): AppError =>
  new AppError(API_ERROR_CODES.CONFLICT, message, details)

export const staleContent = (): AppError =>
  new AppError(API_ERROR_CODES.STALE_CONTENT, '内容已被其他窗口修改，请刷新后重试')

export const rateLimited = (message = '操作过于频繁，请稍后再试'): AppError =>
  new AppError(API_ERROR_CODES.RATE_LIMITED, message)

export const tooLarge = (message = '文件超过大小限制'): AppError =>
  new AppError(API_ERROR_CODES.PAYLOAD_TOO_LARGE, message)

export const unsupportedMedia = (message = '不支持的文件类型'): AppError =>
  new AppError(API_ERROR_CODES.UNSUPPORTED_MEDIA_TYPE, message)
