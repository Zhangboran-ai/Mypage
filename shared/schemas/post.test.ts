import { describe, expect, it } from 'vitest'
import { postInputSchema, publicPostListQuerySchema } from './post'

const validPost = {
  title: '你好，星屿',
  summary: '一篇用于测试的文章摘要。',
  content: '## 正文\n\n内容',
  status: 'DRAFT' as const,
  pinned: false,
  tagIds: [],
}

describe('postInputSchema', () => {
  it('合法数据通过并应用默认值', () => {
    const parsed = postInputSchema.parse(validPost)

    expect(parsed.status).toBe('DRAFT')
    expect(parsed.pinned).toBe(false)
    expect(parsed.tagIds).toEqual([])
    expect(parsed.coverUrl).toBeUndefined()
  })

  it('必填字段缺失时给出对应字段错误', () => {
    const result = postInputSchema.safeParse({})

    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path[0])
      expect(paths).toEqual(expect.arrayContaining(['title', 'summary', 'content']))
    }
  })

  it('拒绝未知的发布状态', () => {
    const result = postInputSchema.safeParse({ ...validPost, status: 'ARCHIVED' })
    expect(result.success).toBe(false)
  })

  it('slug 只允许小写字母、数字与连字符', () => {
    const result = postInputSchema.safeParse({ ...validPost, slug: 'Hello_World' })
    expect(result.success).toBe(false)
  })

  it('定时发布时发布时间必须是合法 ISO 字符串', () => {
    const result = postInputSchema.safeParse({
      ...validPost,
      status: 'SCHEDULED',
      publishedAt: 'not-a-date',
    })
    expect(result.success).toBe(false)
  })
})

describe('publicPostListQuerySchema', () => {
  it('缺省分页参数使用默认值', () => {
    const parsed = publicPostListQuerySchema.parse({})
    expect(parsed.page).toBe(1)
    expect(parsed.pageSize).toBe(12)
  })

  it('pageSize 超过上限被拒绝', () => {
    const result = publicPostListQuerySchema.safeParse({ pageSize: '51' })
    expect(result.success).toBe(false)
  })
})
