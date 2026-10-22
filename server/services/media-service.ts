import { and, desc, eq, ilike, or, sql } from 'drizzle-orm'
import type {
  MediaConfirmInput,
  MediaItem,
  MediaListQuery,
  Paginated,
} from '../../shared/index.js'
import { media, posts, profiles, projectImages, projects, siteSettings } from '../../db/schema.js'
import { db } from '../lib/db.js'
import { conflict, notFound } from '../lib/errors.js'
import { mapMedia } from '../lib/mappers.js'
import { buildPaginationMeta, getPagination } from '../lib/pagination.js'
import { deleteBlob } from '../lib/storage.js'

export async function listMedia(query: MediaListQuery): Promise<Paginated<MediaItem>> {
  const conditions = query.type ? [ilike(media.mimeType, `${query.type}%`)] : []
  const where = conditions.length > 0 ? and(...conditions) : undefined
  const { limit, offset } = getPagination(query.page, query.pageSize)

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(media)
    .where(where)

  const rows = await db
    .select()
    .from(media)
    .where(where)
    .orderBy(desc(media.createdAt))
    .limit(limit)
    .offset(offset)

  return {
    data: rows.map(mapMedia),
    meta: buildPaginationMeta(countRow?.count ?? 0, query.page, query.pageSize),
  }
}

export async function createMedia(input: MediaConfirmInput): Promise<MediaItem> {
  const [row] = await db
    .insert(media)
    .values({
      filename: input.filename,
      url: input.url,
      pathname: input.pathname,
      mimeType: input.mimeType,
      size: input.size,
      width: input.width ?? null,
      height: input.height ?? null,
      alt: input.alt ?? null,
    })
    .onConflictDoUpdate({
      target: media.url,
      set: {
        filename: input.filename,
        pathname: input.pathname,
        mimeType: input.mimeType,
        size: input.size,
        width: input.width ?? null,
        height: input.height ?? null,
        alt: input.alt ?? null,
      },
    })
    .returning()

  return mapMedia(row)
}

export async function updateMediaAlt(id: string, alt: string | null): Promise<MediaItem> {
  const [row] = await db.update(media).set({ alt }).where(eq(media.id, id)).returning()
  if (!row) throw notFound('媒体不存在')
  return mapMedia(row)
}

async function countReferences(url: string): Promise<number> {
  const [postRef, projectRef, imageRef, profileRef, settingRef] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(or(eq(posts.coverUrl, url), eq(posts.ogImage, url))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(eq(projects.coverUrl, url)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(projectImages)
      .where(eq(projectImages.url, url)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(profiles)
      .where(or(eq(profiles.avatarUrl, url), eq(profiles.coverUrl, url))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(siteSettings)
      .where(
        or(
          eq(siteSettings.defaultOgImage, url),
          eq(siteSettings.logoUrl, url),
          eq(siteSettings.faviconUrl, url),
        ),
      ),
  ])

  return (
    (postRef[0]?.count ?? 0) +
    (projectRef[0]?.count ?? 0) +
    (imageRef[0]?.count ?? 0) +
    (profileRef[0]?.count ?? 0) +
    (settingRef[0]?.count ?? 0)
  )
}

export async function deleteMedia(id: string): Promise<void> {
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1)
  if (!row) throw notFound('媒体不存在')

  const references = await countReferences(row.url)
  if (references > 0) {
    throw conflict(`图片仍被 ${references} 处内容引用，请先替换后再删除`)
  }

  await db.delete(media).where(eq(media.id, id))
  await deleteBlob(row.url)
}
