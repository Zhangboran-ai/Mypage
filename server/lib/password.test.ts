import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password.js'

describe('密码哈希', () => {
  it('哈希后可以验证正确密码', async () => {
    const stored = await hashPassword('CorrectHorse123')

    expect(stored.startsWith('argon2id$')).toBe(true)
    await expect(verifyPassword('CorrectHorse123', stored)).resolves.toBe(true)
  })

  it('错误密码验证失败', async () => {
    const stored = await hashPassword('CorrectHorse123')
    await expect(verifyPassword('wrong-password', stored)).resolves.toBe(false)
  })

  it('同一密码两次哈希结果不同，说明使用了随机盐', async () => {
    const first = await hashPassword('SamePassword123')
    const second = await hashPassword('SamePassword123')

    expect(first).not.toBe(second)
    await expect(verifyPassword('SamePassword123', first)).resolves.toBe(true)
    await expect(verifyPassword('SamePassword123', second)).resolves.toBe(true)
  })

  it('格式非法的哈希直接返回 false，不抛异常', async () => {
    await expect(verifyPassword('anything', 'not-a-hash')).resolves.toBe(false)
    await expect(verifyPassword('anything', 'argon2id$t=2$salt$hash')).resolves.toBe(false)
  })
})
