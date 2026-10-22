import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('渲染标题与说明', () => {
    render(<EmptyState title="没有文章" description="写第一篇吧。" />)

    expect(screen.getByText('没有文章')).toBeInTheDocument()
    expect(screen.getByText('写第一篇吧。')).toBeInTheDocument()
  })

  it('渲染操作入口', () => {
    render(<EmptyState title="没有数据" action={<button type="button">新建</button>} />)

    expect(screen.getByRole('button', { name: '新建' })).toBeInTheDocument()
  })
})
