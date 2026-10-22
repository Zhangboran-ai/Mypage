import { describe, expect, it } from 'vitest'
import { restoreOriginalUrl } from './vercel-url.js'

describe('restoreOriginalUrl', () => {
  it('把被重写的单层路径还原为原始路径', () => {
    const restored = restoreOriginalUrl(new Request('https://example.com/api?__path=public/projects'))

    expect(new URL(restored.url).pathname).toBe('/api/public/projects')
    expect(new URL(restored.url).search).toBe('')
  })

  it('还原路径时保留其余查询参数', () => {
    const restored = restoreOriginalUrl(
      new Request('https://example.com/api?__path=public/posts&page=2'),
    )

    expect(new URL(restored.url).pathname).toBe('/api/public/posts')
    expect(new URL(restored.url).search).toBe('?page=2')
  })

  it('平台已保留原始路径时只移除内部参数', () => {
    const restored = restoreOriginalUrl(
      new Request('https://example.com/api/public/tags?__path=public/tags'),
    )

    expect(restored.url).toBe('https://example.com/api/public/tags')
  })

  it('没有内部参数时原样返回同一个请求对象', () => {
    const request = new Request('https://example.com/api/health')

    expect(restoreOriginalUrl(request)).toBe(request)
  })

  it('保留请求方法与请求体', async () => {
    const restored = restoreOriginalUrl(
      new Request('https://example.com/api?__path=admin/posts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: '测试' }),
      }),
    )

    expect(restored.method).toBe('POST')
    await expect(restored.json()).resolves.toEqual({ title: '测试' })
  })
})
