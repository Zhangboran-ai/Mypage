import { and, asc, eq } from 'drizzle-orm'
import type {
  ReorderInput,
  Skill,
  SkillCategory,
  SkillCategoryInput,
  SkillInput,
} from '../../shared'
import { skillCategories, skills } from '../../db/schema'
import { db } from '../lib/db'
import { notFound } from '../lib/errors'
import { mapSkill, mapSkillCategory } from '../lib/mappers'
import { ensureUniqueSlug, normalizeSlug, toSlug } from '../lib/slug'

async function isCategorySlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const rows = await db
    .select({ id: skillCategories.id })
    .from(skillCategories)
    .where(eq(skillCategories.slug, slug))
    .limit(2)

  return rows.some((row) => row.id !== excludeId)
}

async function resolveCategorySlug(
  input: { name: string; slug?: string },
  excludeId?: string,
): Promise<string> {
  const base = input.slug ? normalizeSlug(input.slug) : toSlug(input.name)
  return ensureUniqueSlug(base, (candidate) => isCategorySlugTaken(candidate, excludeId))
}

export async function createSkillCategory(input: SkillCategoryInput): Promise<SkillCategory> {
  const slug = await resolveCategorySlug(input)

  const [created] = await db
    .insert(skillCategories)
    .values({ name: input.name, slug, sortOrder: input.sortOrder, visible: input.visible })
    .returning()

  return mapSkillCategory(created, [])
}

export async function updateSkillCategory(
  id: string,
  input: SkillCategoryInput,
): Promise<SkillCategory> {
  const [existing] = await db
    .select()
    .from(skillCategories)
    .where(eq(skillCategories.id, id))
    .limit(1)

  if (!existing) throw notFound('技能分类不存在')

  const slug =
    input.slug && normalizeSlug(input.slug) !== existing.slug
      ? await resolveCategorySlug(input, id)
      : existing.slug

  const [updated] = await db
    .update(skillCategories)
    .set({ name: input.name, slug, sortOrder: input.sortOrder, visible: input.visible })
    .where(eq(skillCategories.id, id))
    .returning()

  return mapSkillCategory(updated, [])
}

export async function deleteSkillCategory(id: string): Promise<void> {
  const deleted = await db
    .delete(skillCategories)
    .where(eq(skillCategories.id, id))
    .returning({ id: skillCategories.id })

  if (deleted.length === 0) throw notFound('技能分类不存在')
}

export async function createSkill(input: SkillInput): Promise<Skill> {
  const [category] = await db
    .select({ id: skillCategories.id })
    .from(skillCategories)
    .where(eq(skillCategories.id, input.categoryId))
    .limit(1)

  if (!category) throw notFound('技能分类不存在')

  const [created] = await db
    .insert(skills)
    .values({
      categoryId: input.categoryId,
      name: input.name,
      icon: input.icon ?? null,
      level: input.level,
      levelLabel: input.levelLabel ?? null,
      sortOrder: input.sortOrder,
      visible: input.visible,
    })
    .returning()

  return mapSkill(created)
}

export async function updateSkill(id: string, input: SkillInput): Promise<Skill> {
  const [updated] = await db
    .update(skills)
    .set({
      categoryId: input.categoryId,
      name: input.name,
      icon: input.icon ?? null,
      level: input.level,
      levelLabel: input.levelLabel ?? null,
      sortOrder: input.sortOrder,
      visible: input.visible,
    })
    .where(eq(skills.id, id))
    .returning()

  if (!updated) throw notFound('技能不存在')
  return mapSkill(updated)
}

export async function deleteSkill(id: string): Promise<void> {
  const deleted = await db.delete(skills).where(eq(skills.id, id)).returning({ id: skills.id })
  if (deleted.length === 0) throw notFound('技能不存在')
}

export async function reorderSkills(input: ReorderInput): Promise<void> {
  await db.transaction(async (tx) => {
    for (const item of input.items) {
      await tx.update(skills).set({ sortOrder: item.sortOrder }).where(eq(skills.id, item.id))
    }
  })
}

export async function listAllSkillCategories(): Promise<SkillCategory[]> {
  const categoryRows = await db
    .select()
    .from(skillCategories)
    .orderBy(asc(skillCategories.sortOrder), asc(skillCategories.name))

  const skillRows = await db.select().from(skills).orderBy(asc(skills.sortOrder), asc(skills.name))

  return categoryRows.map((category) =>
    mapSkillCategory(
      category,
      skillRows.filter((skill) => skill.categoryId === category.id).map(mapSkill),
    ),
  )
}

export async function findSkillsByCategory(categoryId: string): Promise<Skill[]> {
  const rows = await db
    .select()
    .from(skills)
    .where(and(eq(skills.categoryId, categoryId)))
    .orderBy(asc(skills.sortOrder))

  return rows.map(mapSkill)
}
