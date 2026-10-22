import type { PaginatedMeta } from '../../shared/index.js'

export function getPagination(page: number, pageSize: number): { limit: number; offset: number } {
  return { limit: pageSize, offset: (page - 1) * pageSize }
}

export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginatedMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}
