import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSeo } from './use-seo'

describe('useSeo', () => {
  it('首页只使用站点名作为标题，不重复拼接', () => {
    renderHook(() => useSeo({ siteName: '星屿 Astra', description: '测试站点' }))
    expect(document.title).toBe('星屿 Astra')
  })

  it('内页标题拼接站点名', () => {
    renderHook(() => useSeo({ title: '博客' }))
    expect(document.title).toBe('博客 · 星屿 Astra')
  })

  it('写入 canonical 与描述', () => {
    renderHook(() => useSeo({ title: '关于', description: '个人介绍' }))

    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      '个人介绍',
    )
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      `${window.location.origin}${window.location.pathname}`,
    )
  })

  it('没有 og:image 时移除上一页留下的图片 meta', () => {
    renderHook(() => useSeo({ title: '文章', image: 'https://example.com/cover.png' }))
    expect(document.head.querySelector('meta[property="og:image"]')).not.toBeNull()

    renderHook(() => useSeo({ title: '列表' }))
    expect(document.head.querySelector('meta[property="og:image"]')).toBeNull()
  })
})
