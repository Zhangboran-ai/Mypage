import { and, asc, desc, eq } from 'drizzle-orm'
import type {
  Experience,
  ExperienceInput,
  Profile,
  ProfileUpdateInput,
  PublicProfile,
  SocialLink,
  SocialLinkInput,
} from '../../shared/index.js'
import { experiences, profiles, skillCategories, skills, socialLinks, users } from '../../db/schema.js'
import { db } from '../lib/db.js'
import { notFound } from '../lib/errors.js'
import {
  mapExperience,
  mapProfile,
  mapSkill,
  mapSkillCategory,
  mapSocialLink,
} from '../lib/mappers.js'

export async function getPrimaryUser(): Promise<{ id: string; name: string } | null> {
  const rows = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .orderBy(asc(users.createdAt))
    .limit(1)

  return rows[0] ?? null
}

export async function listSkillCategories(includeHidden: boolean) {
  const categoryRows = await db
    .select()
    .from(skillCategories)
    .orderBy(asc(skillCategories.sortOrder), asc(skillCategories.name))

  const filteredCategories = includeHidden
    ? categoryRows
    : categoryRows.filter((category) => category.visible)

  if (filteredCategories.length === 0) return []

  const skillRows = await db
    .select()
    .from(skills)
    .orderBy(asc(skills.sortOrder), asc(skills.name))

  return filteredCategories.map((category) =>
    mapSkillCategory(
      category,
      skillRows
        .filter(
          (skill) => skill.categoryId === category.id && (includeHidden || skill.visible),
        )
        .map(mapSkill),
    ),
  )
}

export async function getPublicProfile(): Promise<PublicProfile> {
  const user = await getPrimaryUser()
  if (!user) {
    return { profile: null, socialLinks: [], experiences: [], skillCategories: [] }
  }

  const [profileRow] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1)

  const linkRows = await db
    .select()
    .from(socialLinks)
    .where(and(eq(socialLinks.userId, user.id), eq(socialLinks.visible, true)))
    .orderBy(asc(socialLinks.sortOrder), asc(socialLinks.id))

  const experienceRows = await db
    .select()
    .from(experiences)
    .where(eq(experiences.userId, user.id))
    .orderBy(asc(experiences.sortOrder), desc(experiences.startDate))

  return {
    profile: profileRow ? mapProfile(profileRow) : null,
    socialLinks: linkRows.map(mapSocialLink),
    experiences: experienceRows.map(mapExperience),
    skillCategories: await listSkillCategories(false),
  }
}

export async function ensureProfile(userId: string): Promise<Profile> {
  const [existing] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1)

  if (existing) return mapProfile(existing)

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) throw notFound('管理员账号不存在')

  const [created] = await db
    .insert(profiles)
    .values({
      userId,
      displayName: user.name,
      headline: '正在构建自己的数字花园',
      bio: '',
    })
    .returning()

  return mapProfile(created)
}

export async function updateProfile(
  userId: string,
  input: ProfileUpdateInput,
): Promise<Profile> {
  await ensureProfile(userId)

  const values: Record<string, unknown> = { updatedAt: new Date() }
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) values[key] = value
  }

  const [updated] = await db
    .update(profiles)
    .set(values)
    .where(eq(profiles.userId, userId))
    .returning()

  return mapProfile(updated)
}

export async function getAdminProfileBundle(userId: string) {
  const profile = await ensureProfile(userId)

  const linkRows = await db
    .select()
    .from(socialLinks)
    .where(eq(socialLinks.userId, userId))
    .orderBy(asc(socialLinks.sortOrder), asc(socialLinks.id))

  const experienceRows = await db
    .select()
    .from(experiences)
    .where(eq(experiences.userId, userId))
    .orderBy(asc(experiences.sortOrder), desc(experiences.startDate))

  return {
    profile,
    socialLinks: linkRows.map(mapSocialLink),
    experiences: experienceRows.map(mapExperience),
    skillCategories: await listSkillCategories(true),
  }
}

export async function createSocialLink(
  userId: string,
  input: SocialLinkInput,
): Promise<SocialLink> {
  const [created] = await db
    .insert(socialLinks)
    .values({ userId, ...input })
    .returning()

  return mapSocialLink(created)
}

export async function updateSocialLink(
  userId: string,
  id: string,
  input: SocialLinkInput,
): Promise<SocialLink> {
  const [updated] = await db
    .update(socialLinks)
    .set(input)
    .where(and(eq(socialLinks.id, id), eq(socialLinks.userId, userId)))
    .returning()

  if (!updated) throw notFound('社交链接不存在')
  return mapSocialLink(updated)
}

export async function deleteSocialLink(userId: string, id: string): Promise<void> {
  const deleted = await db
    .delete(socialLinks)
    .where(and(eq(socialLinks.id, id), eq(socialLinks.userId, userId)))
    .returning({ id: socialLinks.id })

  if (deleted.length === 0) throw notFound('社交链接不存在')
}

export async function createExperience(
  userId: string,
  input: ExperienceInput,
): Promise<Experience> {
  const [created] = await db
    .insert(experiences)
    .values({
      userId,
      company: input.company,
      role: input.role,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      description: input.description ?? null,
      sortOrder: input.sortOrder,
    })
    .returning()

  return mapExperience(created)
}

export async function updateExperience(
  userId: string,
  id: string,
  input: ExperienceInput,
): Promise<Experience> {
  const [updated] = await db
    .update(experiences)
    .set({
      company: input.company,
      role: input.role,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      description: input.description ?? null,
      sortOrder: input.sortOrder,
    })
    .where(and(eq(experiences.id, id), eq(experiences.userId, userId)))
    .returning()

  if (!updated) throw notFound('履历不存在')
  return mapExperience(updated)
}

export async function deleteExperience(userId: string, id: string): Promise<void> {
  const deleted = await db
    .delete(experiences)
    .where(and(eq(experiences.id, id), eq(experiences.userId, userId)))
    .returning({ id: experiences.id })

  if (deleted.length === 0) throw notFound('履历不存在')
}
