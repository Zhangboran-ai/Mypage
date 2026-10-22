import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Markdown } from './markdown'

describe('Markdown', () => {
  it('渲染标题、列表与代码块', () => {
    render(<Markdown content={'## 标题\n\n- 第一项\n\n```ts\nconst a = 1\n```'} />)

    expect(screen.getByRole('heading', { name: '标题' })).toBeInTheDocument()
    expect(screen.getByText('第一项')).toBeInTheDocument()
    // 代码高亮会把内容拆成多个 span，因此按代码块整体文本断言
    expect(document.querySelector('pre code')?.textContent?.trim()).toBe('const a = 1')
  })

  it('为标题注入锚点 id，供目录跳转', () => {
    render(<Markdown content={'## 小节标题'} />)
    expect(screen.getByRole('heading', { name: '小节标题' })).toHaveAttribute('id')
  })

  it('丢弃 script 标签', () => {
    render(<Markdown content={'正文\n\n<script>alert(1)</script>'} />)
    expect(document.querySelector('script')).toBeNull()
  })

  it('不保留 javascript: 协议链接', () => {
    render(<Markdown content={'[点我](javascript:alert(1))'} />)
    const link = screen.getByText('点我').closest('a')
    expect(link?.getAttribute('href') ?? '').not.toContain('javascript:')
  })
})
