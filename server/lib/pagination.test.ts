import { describe, expect, it } from 'vitest'
import { buildPaginationMeta, getPagination } from './pagination'

describe('getPagination', () => {
  it('第一页从 0 开始', () => {
    expect(getPagination(1, 12)).toEqual({ limit: 12, offset: 0 })
  })

  it('后续页码按 pageSize 偏移', () => {
    expect(getPagination(3, 12)).toEqual({ limit: 12, offset: 24 })
  })
})

describe('buildPaginationMeta', () => {
  it('计算总页数', () => {
    expect(buildPaginationMeta(25, 2, 10)).toEqual({
      page: 2,
      pageSize: 10,
      total: 25,
      totalPages: 3,
    })
  })

  it('没有数据时总页数为 1', () => {
    expect(buildPaginationMeta(0, 1, 10).totalPages).toBe(1)
  })

  it('刚好整除时不多算一页', () => {
    expect(buildPaginationMeta(20, 1, 10).totalPages).toBe(2)
  })
})
