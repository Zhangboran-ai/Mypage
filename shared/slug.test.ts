import { describe, expect, it } from 'vitest'
import { ensureUniqueSlug, fallbackSlug, normalizeSlug, toSlug } from './slug.js'

describe('toSlug', () => {
  it('把英文标题转成短横线形式', () => {
    expect(toSlug('Hello World')).toBe('hello-world')
  })

  it('把中文按拼音转写', () => {
    expect(toSlug('你好 世界')).toBe('ni-hao-shi-jie')
  })

  it('去掉标点并合并连续短横线', () => {
    expect(toSlug('React 19 + Vite!!! 入门')).toBe('react-19-vite-ru-men')
  })

  it('空字符串返回空结果', () => {
    expect(toSlug('   ')).toBe('')
  })

  it('超长标题被截断到 72 个字符以内', () => {
    const slug = toSlug('a'.repeat(200))
    expect(slug.length).toBeLessThanOrEqual(72)
  })
})

describe('normalizeSlug', () => {
  it('只保留小写字母、数字与短横线', () => {
    expect(normalizeSlug('  My_Post!! 2026  ')).toBe('my-post-2026')
  })

  it('长度不超过 80 个字符', () => {
    expect(normalizeSlug('a'.repeat(120)).length).toBe(80)
  })
})

describe('fallbackSlug', () => {
  it('带前缀且不为空', () => {
    expect(fallbackSlug('post')).toMatch(/^post-[a-z0-9]+$/)
  })
})

describe('ensureUniqueSlug', () => {
  it('未冲突时原样返回', async () => {
    await expect(ensureUniqueSlug('hello-world', async () => false)).resolves.toBe('hello-world')
  })

  it('冲突时追加序号', async () => {
    const taken = new Set(['hello-world'])
    const result = await ensureUniqueSlug('hello-world', async (slug) => taken.has(slug))
    expect(result).toBe('hello-world-2')
  })

  it('连续冲突时继续递增', async () => {
    const taken = new Set(['hello-world', 'hello-world-2', 'hello-world-3'])
    const result = await ensureUniqueSlug('hello-world', async (slug) => taken.has(slug))
    expect(result).toBe('hello-world-4')
  })

  it('空输入回退到随机 slug，而不是抛出异常', async () => {
    const result = await ensureUniqueSlug('   ', async () => false)
    expect(result.length).toBeGreaterThan(0)
  })
})
