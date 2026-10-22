import { describe, expect, it } from 'vitest'
import { toClientSlug } from './slug'

describe('toClientSlug', () => {
  it('英文标题直接转写成 slug', () => {
    expect(toClientSlug('Hello World')).toBe('hello-world')
  })

  it('去掉标点并合并空白', () => {
    expect(toClientSlug('  React 19 + Vite!!  ')).toBe('react-19-vite')
  })

  it('纯中文不生成 slug，交给服务端处理', () => {
    expect(toClientSlug('中文标题')).toBe('')
  })

  it('长度不超过 72 个字符', () => {
    expect(toClientSlug('a'.repeat(200)).length).toBeLessThanOrEqual(72)
  })
})
