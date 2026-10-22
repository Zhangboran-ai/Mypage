import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('草稿显示中文状态', () => {
    render(<StatusBadge status="DRAFT" />)
    expect(screen.getByText('草稿')).toBeInTheDocument()
  })

  it('已发布与定时发布都有对应文案', () => {
    const { rerender } = render(<StatusBadge status="PUBLISHED" />)
    expect(screen.getByText('已发布')).toBeInTheDocument()

    rerender(<StatusBadge status="SCHEDULED" />)
    expect(screen.getByText('定时发布')).toBeInTheDocument()
  })
})
