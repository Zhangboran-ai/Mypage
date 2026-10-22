import { describe, expect, it } from 'vitest'
import { contactMessageSchema } from './message'

describe('contactMessageSchema', () => {
  it('昵称与内容必填，邮箱可省略', () => {
    const parsed = contactMessageSchema.parse({ name: '访客', content: '想聊聊合作的事情' })

    expect(parsed.name).toBe('访客')
    expect(parsed.email).toBeUndefined()
  })

  it('允许空字符串邮箱', () => {
    const parsed = contactMessageSchema.parse({ name: '访客', content: '想聊聊合作', email: '' })
    expect(parsed.email).toBe('')
  })

  it('非法邮箱被拒绝', () => {
    const result = contactMessageSchema.safeParse({
      name: '访客',
      content: '想聊聊合作',
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('内容过短被拒绝', () => {
    const result = contactMessageSchema.safeParse({ name: '访客', content: 'hi' })
    expect(result.success).toBe(false)
  })

  it('蜜罐字段非空时被拒绝', () => {
    const result = contactMessageSchema.safeParse({
      name: '访客',
      content: '想聊聊合作',
      website: 'https://spam.example',
    })
    expect(result.success).toBe(false)
  })
})
