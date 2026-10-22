import { describe, expect, it } from 'vitest'
import { app } from './app.js'

describe('管理接口鉴权', () => {
  it('未登录访问后台接口返回 401', async () => {
    const response = await app.request('/api/admin/posts')
    expect(response.status).toBe(401)

    const body = (await response.json()) as { error: { code: string } }
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('未登录调用 /api/auth/me 返回 401', async () => {
    const response = await app.request('/api/auth/me')
    expect(response.status).toBe(401)
  })

  it('后台响应不允许被缓存', async () => {
    const response = await app.request('/api/admin/posts')
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
})

describe('登录接口参数校验', () => {
  it('缺少字段返回 400 与字段错误', async () => {
    const response = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost' },
      body: JSON.stringify({}),
    })

    expect(response.status).toBe(400)

    const body = (await response.json()) as {
      error: { code: string; details?: { path: string }[] }
    }
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.details?.some((item) => item.path === 'email')).toBe(true)
  })
})

describe('CSRF 来源校验', () => {
  it('跨站来源的写请求被拒绝', async () => {
    const response = await app.request('/api/auth/logout', {
      method: 'POST',
      headers: { origin: 'https://evil.example' },
    })

    expect(response.status).toBe(403)
  })
})

describe('未知接口', () => {
  it('返回统一的 404 结构', async () => {
    const response = await app.request('/api/not-exists')
    expect(response.status).toBe(404)

    const body = (await response.json()) as { error: { code: string } }
    expect(body.error.code).toBe('NOT_FOUND')
  })
})
