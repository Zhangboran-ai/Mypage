import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, fromDatetimeLocal, toDatetimeLocal } from './format'

describe('formatDate', () => {
  it('按 Asia/Shanghai 展示日期', () => {
    expect(formatDate('2026-01-01T00:00:00.000Z')).toBe('2026-01-01')
  })

  it('接近午夜的时间会换算到东八区', () => {
    expect(formatDate('2026-01-01T16:30:00.000Z')).toBe('2026-01-02')
  })

  it('空值与非法值返回占位符', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('not-a-date')).toBe('—')
  })
})

describe('formatDateTime', () => {
  it('输出到分钟并保持 24 小时制', () => {
    expect(formatDateTime('2026-01-01T16:30:00.000Z')).toBe('2026-01-02 00:30')
  })
})

describe('datetime-local 转换', () => {
  it('来回转换保持同一时刻', () => {
    const iso = '2026-03-05T08:15:00.000Z'
    const local = toDatetimeLocal(iso)
    expect(local).toHaveLength(16)
    expect(fromDatetimeLocal(local)).toBe(iso)
  })

  it('空输入返回空字符串或 null', () => {
    expect(toDatetimeLocal(null)).toBe('')
    expect(fromDatetimeLocal('')).toBeNull()
  })
})
