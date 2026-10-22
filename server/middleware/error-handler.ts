import type { ErrorHandler } from 'hono'
import { ZodError } from 'zod'
import type { AppEnv } from '../types'
import { AppError } from '../lib/errors'

function isPostgresError(error: unknown): error is { code: string; detail?: string } {
  return typeof error === 'object' && error !== null && 'code' in error
}

export const onError: ErrorHandler<AppEnv> = (error, c) => {
  if (error instanceof AppError) {
    return c.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      error.status as 400,
    )
  }

  if (error instanceof ZodError) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: '参数校验失败',
          details: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      },
      400,
    )
  }

  if (isPostgresError(error) && error.code === '23505') {
    return c.json({ error: { code: 'CONFLICT', message: '数据已存在，请更换名称或标识' } }, 409)
  }

  console.error('[api] 未处理异常', error)
  return c.json({ error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } }, 500)
}
