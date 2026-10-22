import { and, asc, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import type {
  AdminProjectDetail,
  AdminProjectListQuery,
  ContentStatus,
  Paginated,
  ProjectCard,
  ProjectDetail,
  ProjectInput,
  ProjectListQuery,
  ReorderInput,
  TechTag,
} from '../../shared/index.js'
import {
  projectImages,
  projects,
  projectTechTags,
  techTags,
} from '../../db/schema.js'
import { db } from '../lib/db.js'
import { badRequest, notFound, staleContent } from '../lib/errors.js'
import { mapProject } from '../lib/mappers.js'
import { buildPaginationMeta, getPagination } from '../lib/pagination.js'
import { ensureUniqueSlug, fallbackSlug, normalizeSlug, toSlug } from '../lib/slug.js'
import { projectVisibleCondition } from '../lib/visibility.js'

const projectListColumns = {
  id: projects.id,
  title: projects.title,
  slug: projects.slug,
  summary: projects.summary,
  coverUrl: projects.coverUrl,
  repoUrl: projects.repoUrl,
  demoUrl: projects.demoUrl,
  role: projects.role,
  startDate: projects.startDate,
  endDate: projects.endDate,
  featured: projects.featured,
  status: projects.status,
  sortOrder: projects.sortOrder,
  publishedAt: projects.publishedAt,
  updatedAt: projects.updatedAt,
}

type ProjectListRow = {
  id: string
  title: string
  slug: string
  summary: string
  coverUrl: string | null
  repoUrl: string | null
  demoUrl: string | null
  role: string | null
  startDate: Date | null
  endDate: Date | null
  featured: boolean
  status: ContentStatus
  sortOrder: number
  publishedAt: Date | null
  updatedAt: Date
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`)
}

async function isProjectSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const rows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.slug, slug))
    .limit(2)

  return rows.some((row) => row.id !== excludeId)
}

async function fetchTechTags(projectIds: string[]): Promise<Map<string, TechTag[]>> {
  const map = new Map<string, TechTag[]>()
  if (projectIds.length === 0) return map

  const rows = await db
    .select({
      projectId: projectTechTags.projectId,
      id: techTags.id,
      name: techTags.name,
      slug: techTags.slug,
    })
    .from(projectTechTags)
    .innerJoin(techTags, eq(techTags.id, projectTechTags.techId))
    .where(inArray(projectTechTags.projectId, projectIds))

  for (const row of rows) {
    const list = map.get(row.projectId) ?? []
    list.push({ id: row.id, name: row.name, slug: row.slug })
    map.set(row.projectId, list)
  }

  return map
}

async function attachTechTags(rows: ProjectListRow[]): Promise<ProjectCard[]> {
  const techMap = await fetchTechTags(rows.map((row) => row.id))
  return rows.map((row) => mapProject(row, techMap.get(row.id) ?? []))
}

function techCondition(techSlug: string): SQL {
  return inArray(
    projects.id,
    db
      .select({ id: projectTechTags.projectId })
      .from(projectTechTags)
      .innerJoin(techTags, eq(techTags.id, projectTechTags.techId))
      .where(eq(techTags.slug, techSlug)),
  )
}

export async function listPublicProjects(
  query: ProjectListQuery,
): Promise<Paginated<ProjectCard>> {
  const conditions: SQL[] = [projectVisibleCondition()]

  if (query.featured !== undefined) conditions.push(eq(projects.featured, query.featured))
  if (query.tech) conditions.push(techCondition(query.tech))

  const where = and(...conditions) ?? sql`true`
  const { limit, offset } = getPagination(query.page, query.pageSize)

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(projects)
    .where(where)

  const rows = await db
    .select(projectListColumns)
    .from(projects)
    .where(where)
    .orderBy(asc(projects.sortOrder), desc(projects.publishedAt), asc(projects.id))
    .limit(limit)
    .offset(offset)

  return {
    data: await attachTechTags(rows),
    meta: buildPaginationMeta(countRow?.count ?? 0, query.page, query.pageSize),
  }
}

export async function getPublicProjectBySlug(slug: string): Promise<ProjectDetail> {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(projectVisibleCondition(), eq(projects.slug, slug)))
    .limit(1)

  if (!row) throw notFound('项目不存在或尚未发布')

  const [images, techRows] = await Promise.all([
    db
      .select()
      .from(projectImages)
      .where(eq(projectImages.projectId, row.id))
      .orderBy(asc(projectImages.sortOrder), asc(projectImages.id)),
    db
      .select({ id: techTags.id, name: techTags.name, slug: techTags.slug })
      .from(projectTechTags)
      .innerJoin(techTags, eq(techTags.id, projectTechTags.techId))
      .where(eq(projectTechTags.projectId, row.id)),
  ])

  return {
    ...mapProject(row, techRows),
    content: row.content,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    images: images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      sortOrder: image.sortOrder,
    })),
  }
}

export async function listAdminProjects(
  query: AdminProjectListQuery,
): Promise<Paginated<ProjectCard>> {
  const conditions: SQL[] = [isNull(projects.deletedAt)]

  if (query.status) conditions.push(eq(projects.status, query.status))
  if (query.q) {
    const pattern = `%${escapeLike(query.q)}%`
    const search = or(ilike(projects.title, pattern), ilike(projects.summary, pattern))
    if (search) conditions.push(search)
  }

  const where = and(...conditions) ?? sql`true`
  const { limit, offset } = getPagination(query.page, query.pageSize)

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(projects)
    .where(where)

  const rows = await db
    .select(projectListColumns)
    .from(projects)
    .where(where)
    .orderBy(desc(projects.updatedAt))
    .limit(limit)
    .offset(offset)

  return {
    data: await attachTechTags(rows),
    meta: buildPaginationMeta(countRow?.count ?? 0, query.page, query.pageSize),
  }
}

export async function getAdminProject(id: string): Promise<AdminProjectDetail> {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), isNull(projects.deletedAt)))
    .limit(1)

  if (!row) throw notFound('项目不存在')

  const [images, techRows] = await Promise.all([
    db
      .select()
      .from(projectImages)
      .where(eq(projectImages.projectId, id))
      .orderBy(asc(projectImages.sortOrder), asc(projectImages.id)),
    db
      .select({ id: techTags.id, name: techTags.name, slug: techTags.slug })
      .from(projectTechTags)
      .innerJoin(techTags, eq(techTags.id, projectTechTags.techId))
      .where(eq(projectTechTags.projectId, id)),
  ])

  return {
    ...mapProject(row, techRows),
    content: row.content,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    images: images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      sortOrder: image.sortOrder,
    })),
    techTagNames: techRows.map((tech) => tech.name),
  }
}

function resolvePublishedAt(
  status: ContentStatus,
  publishedAt: string | null | undefined,
): Date | null {
  if (status === 'DRAFT') return null

  if (status === 'SCHEDULED') {
    const date = publishedAt ? new Date(publishedAt) : null
    if (!date || Number.isNaN(date.getTime())) throw badRequest('定时发布需要选择发布时间')
    if (date.getTime() <= Date.now()) throw badRequest('定时发布时间必须晚于当前时间')
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
  return ensureUniqueSlug(base, (candidate) => isProjectSlugTaken(candidate, excludeId))
}

async function syncTechTags(tx: Tx, projectId: string, names: string[]): Promise<void> {
  const uniqueNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))]

  for (const name of uniqueNames) {
    const slug = toSlug(name) || fallbackSlug('tech')

    const existing = await tx
      .select()
      .from(techTags)
      .where(or(eq(techTags.name, name), eq(techTags.slug, slug)))
      .limit(1)

    let tech = existing[0]

    if (!tech) {
      const [created] = await tx
        .insert(techTags)
        .values({ name, slug })
        .onConflictDoNothing()
        .returning()

      if (created) {
        tech = created
      } else {
        const [again] = await tx
          .select()
          .from(techTags)
          .where(or(eq(techTags.name, name), eq(techTags.slug, slug)))
          .limit(1)
        tech = again
      }
    }

    if (tech) {
      await tx
        .insert(projectTechTags)
        .values({ projectId, techId: tech.id })
        .onConflictDoNothing()
    }
  }
}

export async function createProject(input: ProjectInput): Promise<{ id: string; slug: string }> {
  const slug = await resolveSlug(input.title, input.slug)
  const publishedAt = resolvePublishedAt(input.status, input.publishedAt)

  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(projects)
      .values({
        title: input.title,
        slug,
        summary: input.summary,
        content: input.content ?? null,
        coverUrl: input.coverUrl ?? null,
        repoUrl: input.repoUrl ?? null,
        demoUrl: input.demoUrl ?? null,
        role: input.role ?? null,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        featured: input.featured,
        status: input.status,
        sortOrder: input.sortOrder,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        publishedAt,
      })
      .returning({ id: projects.id, slug: projects.slug })

    await syncTechTags(tx, row.id, input.techTags)

    if (input.images.length > 0) {
      await tx.insert(projectImages).values(
        input.images.map((image) => ({
          projectId: row.id,
          url: image.url,
          alt: image.alt ?? null,
          sortOrder: image.sortOrder,
        })),
      )
    }

    return row
  })
}

export async function updateProject(
  id: string,
  input: ProjectInput,
): Promise<{ id: string; slug: string }> {
  const [existing] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), isNull(projects.deletedAt)))
    .limit(1)

  if (!existing) throw notFound('项目不存在')

  if (input.updatedAt && new Date(input.updatedAt).getTime() !== existing.updatedAt.getTime()) {
    throw staleContent()
  }

  const slug =
    input.slug && normalizeSlug(input.slug) !== existing.slug
      ? await resolveSlug(input.title, input.slug, id)
      : existing.slug

  const publishedAt = resolvePublishedAt(input.status, input.publishedAt)

  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(projects)
      .set({
        title: input.title,
        slug,
        summary: input.summary,
        content: input.content ?? null,
        coverUrl: input.coverUrl ?? null,
        repoUrl: input.repoUrl ?? null,
        demoUrl: input.demoUrl ?? null,
        role: input.role ?? null,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        featured: input.featured,
        status: input.status,
        sortOrder: input.sortOrder,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning({ id: projects.id, slug: projects.slug })

    await tx.delete(projectTechTags).where(eq(projectTechTags.projectId, id))
    await syncTechTags(tx, id, input.techTags)

    await tx.delete(projectImages).where(eq(projectImages.projectId, id))
    if (input.images.length > 0) {
      await tx.insert(projectImages).values(
        input.images.map((image) => ({
          projectId: id,
          url: image.url,
          alt: image.alt ?? null,
          sortOrder: image.sortOrder,
        })),
      )
    }

    return row
  })
}

export async function deleteProject(id: string): Promise<void> {
  const deleted = await db
    .update(projects)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(projects.id, id), isNull(projects.deletedAt)))
    .returning({ id: projects.id })

  if (deleted.length === 0) throw notFound('项目不存在')
}

export async function reorderProjects(input: ReorderInput): Promise<void> {
  await db.transaction(async (tx) => {
    for (const item of input.items) {
      await tx.update(projects).set({ sortOrder: item.sortOrder }).where(eq(projects.id, item.id))
    }
  })
}

export async function listTechTags(): Promise<TechTag[]> {
  return db.select().from(techTags).orderBy(asc(techTags.name))
}
