import { pinyin } from 'pinyin-pro'

export function toSlug(input: string): string {
  const raw = input.trim()
  if (!raw) return ''

  const chunks = pinyin(raw, { toneType: 'none', type: 'array', nonZh: 'consecutive' })
  const base = chunks
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 72)

  return base
}

export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80)
}

export function fallbackSlug(prefix = 'item'): string {
  return `${prefix}-${Date.now().toString(36)}`
}

export async function ensureUniqueSlug(
  base: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const candidate = normalizeSlug(base) || fallbackSlug()

  if (!(await isTaken(candidate))) return candidate

  for (let suffix = 2; suffix <= 50; suffix += 1) {
    const next = `${candidate}-${suffix}`
    if (!(await isTaken(next))) return next
  }

  return `${candidate}-${Date.now().toString(36)}`
}
