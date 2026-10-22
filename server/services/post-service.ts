import { and, asc, desc, eq, gt, ilike, inArray, isNull, lt, ne, or, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import type {
  AdminPostDetail,
  ContentStatus,
  Paginated,
  PostDetail,
  PostInput,
  PostListItem,
  PostListQuery,
  PublicPostListQuery,
  Tag,
} from '../../shared/index.js'
import { postTags, posts, tags } from '../../db/schema.js'
import { db } from '../lib/db.js'
import { badRequest, notFound, staleContent } from '../lib/errors.js'
import { mapPost, mapTag } from '../lib/mappers.js'
import { buildPaginationMeta, getPagination } from '../lib/pagination.js'
import { toReadingTime } from '../lib/reading-time.js'
import { ensureUniqueSlug, normalizeSlug, toSlug } from '../lib/slug.js'
import { postVisibleCondition } from '../lib/visibility.js'
import { assertTagsExist } from './tag-service.js'

const postListColumns = {
  id: posts.id,
  title: posts.title,
  slug: posts.slug,
  summary: posts.summary,
  coverUrl: posts.coverUrl,
  status: posts.status,
  pinned: posts.pinned,
  readingTime: posts.readingTime,
  views: posts.views,
  publishedAt: posts.publishedAt,
  updatedAt: posts.updatedAt,
}

type PostListRow = {
  id: string
  title: string
  slug: string
  summary: string
  coverUrl: string | null
  status: ContentStatus
  pinned: boolean
  readingTime: number
  views: number
  publishedAt: Date | null
  updatedAt: Date
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`)
}

async function isPostSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const rows = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(2)

  return rows.some((row) => row.id !== excludeId)
}

function tagCondition(tagSlug: string): SQL {
  return inArray(
    posts.id,
    db
      .select({ id: postTags.postId })
      .from(postTags)
      .innerJoin(tags, eq(tags.id, postTags.tagId))
      .where(eq(tags.slug, tagSlug)),
  )
}

async function fetchTagsForPosts(postIds: string[]): Promise<Map<string, Tag[]>> {
  const map = new Map<string, Tag[]>()
  if (postIds.length === 0) return map

  const rows = await db
    .select({
      postId: postTags.postId,
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
    })
    .from(postTags)
    .innerJoin(tags, eq(tags.id, postTags.tagId))
    .where(inArray(postTags.postId, postIds))

  for (const row of rows) {
    const list = map.get(row.postId) ?? []
    list.push(mapTag(row))
    map.set(row.postId, list)
  }

  return map
}

async function attachTags(rows: PostListRow[]): Promise<PostListItem[]> {
  const ids = rows.map((row) => row.id)
  const tagMap = await fetchTagsForPosts(ids)
  return rows.map((row) => mapPost(row, tagMap.get(row.id) ?? []))
}

export async function listPublicPosts(
  query: PublicPostListQuery,
): Promise<Paginated<PostListItem>> {
  const conditions: SQL[] = [postVisibleCondition()]

  if (query.tag) conditions.push(tagCondition(query.tag))
  if (query.q) {
    const pattern = `%${escapeLike(query.q)}%`
    const search = or(ilike(posts.title, pattern), ilike(posts.summary, pattern))
    if (search) conditions.push(search)
  }

  const where = and(...conditions) ?? sql`true`
  const { limit, offset } = getPagination(query.page, query.pageSize)

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posts)
    .where(where)

  const rows = await db
    .select(postListColumns)
    .from(posts)
    .where(where)
    .orderBy(desc(posts.pinned), desc(posts.publishedAt), desc(posts.id))
    .limit(limit)
    .offset(offset)

  return {
    data: await attachTags(rows),
    meta: buildPaginationMeta(countRow?.count ?? 0, query.page, query.pageSize),
  }
}

export async function getPublicPostBySlug(slug: string): Promise<PostDetail> {
  const [row] = await db
    .select()
    .from(posts)
    .where(and(postVisibleCondition(), eq(posts.slug, slug)))
    .limit(1)

  if (!row) throw notFound('文章不存在或尚未发布')

  const tagMap = await fetchTagsForPosts([row.id])
  const anchor = row.publishedAt ?? row.createdAt

  const [prevRow] = await db
    .select({ title: posts.title, slug: posts.slug })
    .from(posts)
    .where(and(postVisibleCondition(), lt(posts.publishedAt, anchor), ne(posts.id, row.id)))
    .orderBy(desc(posts.publishedAt))
    .limit(1)

  const [nextRow] = await db
    .select({ title: posts.title, slug: posts.slug })
    .from(posts)
    .where(and(postVisibleCondition(), gt(posts.publishedAt, anchor), ne(posts.id, row.id)))
    .orderBy(asc(posts.publishedAt))
    .limit(1)

  const currentTagIds = (tagMap.get(row.id) ?? []).map((tag) => tag.id)
  let related: PostListItem[] = []

  if (currentTagIds.length > 0) {
    const relatedIds = await db
      .selectDistinct({ id: postTags.postId })
      .from(postTags)
      .where(and(inArray(postTags.tagId, currentTagIds), ne(postTags.postId, row.id)))
      .limit(8)

    if (relatedIds.length > 0) {
      const relatedRows = await db
        .select(postListColumns)
        .from(posts)
        .where(and(postVisibleCondition(), inArray(posts.id, relatedIds.map((item) => item.id))))
        .orderBy(desc(posts.publishedAt))
        .limit(3)

      related = await attachTags(relatedRows)
    }
  }

  // 浏览量用原生更新，避免触发 updatedAt 的 $onUpdate
  await db.execute(sql`update ${posts} set views = views + 1 where id = ${row.id}`)

  return {
    ...mapPost(row, tagMap.get(row.id) ?? []),
    content: row.content,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    ogImage: row.ogImage,
    prev: prevRow ?? null,
    next: nextRow ?? null,
    related,
  }
}

export async function listAdminPosts(query: PostListQuery): Promise<Paginated<PostListItem>> {
  const conditions: SQL[] = [isNull(posts.deletedAt)]

  if (query.status) conditions.push(eq(posts.status, query.status))
  if (query.tag) conditions.push(tagCondition(query.tag))
  if (query.q) {
    const pattern = `%${escapeLike(query.q)}%`
    const search = or(ilike(posts.title, pattern), ilike(posts.summary, pattern))
    if (search) conditions.push(search)
  }

  const where = and(...conditions) ?? sql`true`
  const { limit, offset } = getPagination(query.page, query.pageSize)

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posts)
    .where(where)

  const rows = await db
    .select(postListColumns)
    .from(posts)
    .where(where)
    .orderBy(desc(posts.updatedAt))
    .limit(limit)
    .offset(offset)

  return {
    data: await attachTags(rows),
    meta: buildPaginationMeta(countRow?.count ?? 0, query.page, query.pageSize),
  }
}

export async function getAdminPost(id: string): Promise<AdminPostDetail> {
  const [row] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
    .limit(1)

  if (!row) throw notFound('文章不存在')

  const tagMap = await fetchTagsForPosts([row.id])
  const postTagsList = tagMap.get(row.id) ?? []

  return {
    ...mapPost(row, postTagsList),
    content: row.content,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    ogImage: row.ogImage,
    tagIds: postTagsList.map((tag) => tag.id),
  }
}

function resolvePublishedAt(
  status: ContentStatus,
  publishedAt: string | null | undefined,
): Date | null {
  if (status === 'DRAFT') return null

  if (status === 'SCHEDULED') {
    const date = publishedAt ? new Date(publishedAt) : null
    if (!date || Number.isNaN(date.getTime())) {
      throw badRequest('定时发布需要选择发布时间')
    }
    if (date.getTime() <= Date.now()) {
      throw badRequest('定时发布时间必须晚于当前时间')
    }
    return date
  }

  return publishedAt ? new Date(publishedAt) : new Date()
}

async function resolveSlug(
  title: string,
  slugInput: string | undefined,
  excludeId?: string,
): Promise<string> {
  const base = slugInput ? normalizeSlug(slugInput) : toSlug(title)
  return ensureUniqueSlug(base, (candidate) => isPostSlugTaken(candidate, excludeId))
}

export async function createPost(
  authorId: string,
  input: PostInput,
): Promise<{ id: string; slug: string }> {
  const slug = await resolveSlug(input.title, input.slug)
  const publishedAt = resolvePublishedAt(input.status, input.publishedAt)
  const readingTime = toReadingTime(input.content)

  await assertTagsExist(input.tagIds)
  const uniqueTagIds = [...new Set(input.tagIds)]

  const created = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(posts)
      .values({
        authorId,
        title: input.title,
        slug,
        summary: input.summary,
        content: input.content,
        coverUrl: input.coverUrl ?? null,
        status: input.status,
        pinned: input.pinned,
        readingTime,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        ogImage: input.ogImage ?? null,
        publishedAt,
      })
      .returning({ id: posts.id, slug: posts.slug })

    if (uniqueTagIds.length > 0) {
      await tx.insert(postTags).values(uniqueTagIds.map((tagId) => ({ postId: row.id, tagId })))
    }

    return row
  })

  return created
}

export async function updatePost(
  id: string,
  input: PostInput,
): Promise<{ id: string; slug: string }> {
  const [existing] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
    .limit(1)

  if (!existing) throw notFound('文章不存在')

  if (input.updatedAt && new Date(input.updatedAt).getTime() !== existing.updatedAt.getTime()) {
    throw staleContent()
  }

  const slug =
    input.slug && normalizeSlug(input.slug) !== existing.slug
      ? await resolveSlug(input.title, input.slug, id)
      : existing.slug

  const publishedAt = resolvePublishedAt(input.status, input.publishedAt)
  const readingTime = toReadingTime(input.content)

  await assertTagsExist(input.tagIds)
  const uniqueTagIds = [...new Set(input.tagIds)]

  const updated = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(posts)
      .set({
        title: input.title,
        slug,
        summary: input.summary,
        content: input.content,
        coverUrl: input.coverUrl ?? null,
        status: input.status,
        pinned: input.pinned,
        readingTime,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        ogImage: input.ogImage ?? null,
        publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning({ id: posts.id, slug: posts.slug })

    await tx.delete(postTags).where(eq(postTags.postId, id))
    if (uniqueTagIds.length > 0) {
      await tx.insert(postTags).values(uniqueTagIds.map((tagId) => ({ postId: id, tagId })))
    }

    return row
  })

  return updated
}

export async function publishPost(
  id: string,
  publishedAt: string | null | undefined,
): Promise<void> {
  const [existing] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
    .limit(1)

  if (!existing) throw notFound('文章不存在')

  const target = publishedAt ? new Date(publishedAt) : new Date()
  if (Number.isNaN(target.getTime())) throw badRequest('发布时间格式不正确')

  const status: ContentStatus = target.getTime() > Date.now() ? 'SCHEDULED' : 'PUBLISHED'

  await db
    .update(posts)
    .set({ status, publishedAt: target, updatedAt: new Date() })
    .where(eq(posts.id, id))
}

export async function unpublishPost(id: string): Promise<void> {
  const updated = await db
    .update(posts)
    .set({ status: 'DRAFT', publishedAt: null, updatedAt: new Date() })
    .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
    .returning({ id: posts.id })

  if (updated.length === 0) throw notFound('文章不存在')
}

export async function deletePost(id: string): Promise<void> {
  const deleted = await db
    .update(posts)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
    .returning({ id: posts.id })

  if (deleted.length === 0) throw notFound('文章不存在')
}

export async function listRecentAdminPosts(limit = 5): Promise<PostListItem[]> {
  const rows = await db
    .select(postListColumns)
    .from(posts)
    .where(isNull(posts.deletedAt))
    .orderBy(desc(posts.updatedAt))
    .limit(limit)

  return attachTags(rows)
}
