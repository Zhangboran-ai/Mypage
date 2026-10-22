import { and, asc, eq, inArray, isNull, or, sql } from 'drizzle-orm'
import type { Tag, TagWithCount } from '../../shared'
import { postTags, posts, tags } from '../../db/schema'
import { db } from '../lib/db'
import { conflict, notFound } from '../lib/errors'
import { mapTag } from '../lib/mappers'
import { ensureUniqueSlug, normalizeSlug, toSlug } from '../lib/slug'

async function isTagSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const rows = await db.select({ id: tags.id }).from(tags).where(eq(tags.slug, slug)).limit(2)
  return rows.some((row) => row.id !== excludeId)
}

export async function listTagsWithCounts(): Promise<TagWithCount[]> {
  const rows = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      count: sql<number>`count(${posts.id})::int`,
    })
    .from(tags)
    .leftJoin(postTags, eq(postTags.tagId, tags.id))
    .leftJoin(
      posts,
      and(
        eq(posts.id, postTags.postId),
        isNull(posts.deletedAt),
        or(
          eq(posts.status, 'PUBLISHED'),
          and(eq(posts.status, 'SCHEDULED'), sql`${posts.publishedAt} <= now()`),
        ),
      ),
    )
    .groupBy(tags.id, tags.name, tags.slug)
    .orderBy(asc(tags.name))

  return rows
}

export async function listAllTags(): Promise<Tag[]> {
  const rows = await db.select().from(tags).orderBy(asc(tags.name))
  return rows.map(mapTag)
}

export async function createTag(name: string, slugInput?: string): Promise<Tag> {
  const trimmed = name.trim()

  const existingByName = await db
    .select({ id: tags.id })
    .from(tags)
    .where(eq(tags.name, trimmed))
    .limit(1)

  if (existingByName.length > 0) throw conflict('标签已存在')

  const base = slugInput ? normalizeSlug(slugInput) : toSlug(trimmed)
  const slug = await ensureUniqueSlug(base, (candidate) => isTagSlugTaken(candidate))

  const [created] = await db.insert(tags).values({ name: trimmed, slug }).returning()
  return mapTag(created)
}

export async function updateTag(id: string, name: string, slugInput?: string): Promise<Tag> {
  const [existing] = await db.select().from(tags).where(eq(tags.id, id)).limit(1)
  if (!existing) throw notFound('标签不存在')

  const trimmed = name.trim()
  const duplicate = await db
    .select({ id: tags.id })
    .from(tags)
    .where(eq(tags.name, trimmed))
    .limit(2)

  if (duplicate.some((row) => row.id !== id)) throw conflict('标签名已存在')

  const nextSlug =
    slugInput && normalizeSlug(slugInput) !== existing.slug
      ? await ensureUniqueSlug(normalizeSlug(slugInput), (candidate) => isTagSlugTaken(candidate, id))
      : existing.slug

  const [updated] = await db
    .update(tags)
    .set({ name: trimmed, slug: nextSlug })
    .where(eq(tags.id, id))
    .returning()

  return mapTag(updated)
}

export async function deleteTag(id: string): Promise<void> {
  const deleted = await db.delete(tags).where(eq(tags.id, id)).returning({ id: tags.id })
  if (deleted.length === 0) throw notFound('标签不存在')
}

export async function assertTagsExist(tagIds: string[]): Promise<void> {
  if (tagIds.length === 0) return

  const unique = [...new Set(tagIds)]
  const rows = await db
    .select({ id: tags.id })
    .from(tags)
    .where(inArray(tags.id, unique))

  if (rows.length !== unique.length) {
    throw notFound('部分标签不存在')
  }
}
