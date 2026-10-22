import { argon2idAsync } from '@noble/hashes/argon2'
import { randomBytes, timingSafeEqual } from 'node:crypto'

const PARAMS = { t: 2, m: 19456, p: 1, dkLen: 32 } as const
const SALT_BYTES = 16

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url')
}

function fromBase64Url(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'base64url'))
}

export async function hashPassword(password: string): Promise<string> {
  // 转成普通 Uint8Array：jsdom 环境下 Buffer 可能不是同一 realm 的 Uint8Array
  const salt = new Uint8Array(randomBytes(SALT_BYTES))
  const hash = await argon2idAsync(password, salt, PARAMS)
  return `argon2id$t=${PARAMS.t},m=${PARAMS.m},p=${PARAMS.p}$${toBase64Url(
    salt,
  )}$${toBase64Url(hash)}`
}

type ParsedHash = {
  salt: Uint8Array
  hash: Uint8Array
  t: number
  m: number
  p: number
}

function parseHash(stored: string): ParsedHash | null {
  const parts = stored.split('$')
  if (parts.length !== 4 || parts[0] !== 'argon2id') return null

  const params = Object.fromEntries(
    parts[1].split(',').map((pair) => {
      const [key, value] = pair.split('=')
      return [key, Number(value)]
    }),
  ) as Record<string, number>

  if (!params.t || !params.m || !params.p) return null

  return {
    salt: fromBase64Url(parts[2]),
    hash: fromBase64Url(parts[3]),
    t: params.t,
    m: params.m,
    p: params.p,
  }
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parseHash(stored)
  if (!parsed) return false

  const candidate = await argon2idAsync(password, parsed.salt, {
    t: parsed.t,
    m: parsed.m,
    p: parsed.p,
    dkLen: parsed.hash.length,
  })

  if (candidate.length !== parsed.hash.length) return false
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(parsed.hash))
}
