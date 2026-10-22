import type { InferSelectModel } from 'drizzle-orm'
import type * as schema from '../../db/schema'
import type {
  Experience,
  MediaItem,
  Message,
  PostListItem,
  Profile,
  ProjectCard,
  SessionInfo,
  SiteSettings,
  Skill,
  SkillCategory,
  SocialLink,
  Tag,
} from '../../shared'

export type ProfileRow = InferSelectModel<typeof schema.profiles>
export type SocialLinkRow = InferSelectModel<typeof schema.socialLinks>
export type ExperienceRow = InferSelectModel<typeof schema.experiences>
export type SkillRow = InferSelectModel<typeof schema.skills>
export type SkillCategoryRow = InferSelectModel<typeof schema.skillCategories>
export type PostRow = InferSelectModel<typeof schema.posts>
export type ProjectRow = InferSelectModel<typeof schema.projects>
export type MediaRow = InferSelectModel<typeof schema.media>
export type MessageRow = InferSelectModel<typeof schema.contactMessages>
export type SessionRow = InferSelectModel<typeof schema.sessions>

export const iso = (value: Date | null): string | null => (value ? value.toISOString() : null)

export function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.displayName,
    fullName: row.fullName,
    headline: row.headline,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    coverUrl: row.coverUrl,
    location: row.location,
    publicEmail: row.publicEmail,
    availability: row.availability,
    statusText: row.statusText,
    heroTitle: row.heroTitle,
    heroSubtitle: row.heroSubtitle,
    resumeUrl: row.resumeUrl,
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function mapSocialLink(row: SocialLinkRow): SocialLink {
  return {
    id: row.id,
    platform: row.platform,
    label: row.label,
    url: row.url,
    icon: row.icon,
    sortOrder: row.sortOrder,
    visible: row.visible,
  }
}

export function mapExperience(row: ExperienceRow): Experience {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    startDate: row.startDate.toISOString(),
    endDate: iso(row.endDate),
    description: row.description,
    sortOrder: row.sortOrder,
  }
}

export function mapSkill(row: SkillRow): Skill {
  return {
    id: row.id,
    categoryId: row.categoryId,
    name: row.name,
    icon: row.icon,
    level: row.level,
    levelLabel: row.levelLabel,
    sortOrder: row.sortOrder,
    visible: row.visible,
  }
}

export function mapSkillCategory(row: SkillCategoryRow, skills: Skill[]): SkillCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sortOrder,
    visible: row.visible,
    skills,
  }
}

export function mapTag(row: { id: string; name: string; slug: string }): Tag {
  return { id: row.id, name: row.name, slug: row.slug }
}

export function mapPost(
  row: Pick<
    PostRow,
    | 'id'
    | 'title'
    | 'slug'
    | 'summary'
    | 'coverUrl'
    | 'status'
    | 'pinned'
    | 'readingTime'
    | 'views'
    | 'publishedAt'
    | 'updatedAt'
  >,
  tags: Tag[],
): PostListItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    coverUrl: row.coverUrl,
    status: row.status,
    pinned: row.pinned,
    readingTime: row.readingTime,
    views: row.views,
    publishedAt: iso(row.publishedAt),
    updatedAt: row.updatedAt.toISOString(),
    tags,
  }
}

export function mapProject(
  row: Pick<
    ProjectRow,
    | 'id'
    | 'title'
    | 'slug'
    | 'summary'
    | 'coverUrl'
    | 'repoUrl'
    | 'demoUrl'
    | 'role'
    | 'startDate'
    | 'endDate'
    | 'featured'
    | 'status'
    | 'sortOrder'
    | 'publishedAt'
    | 'updatedAt'
  >,
  techTags: Tag[],
): ProjectCard {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    coverUrl: row.coverUrl,
    repoUrl: row.repoUrl,
    demoUrl: row.demoUrl,
    role: row.role,
    startDate: iso(row.startDate),
    endDate: iso(row.endDate),
    featured: row.featured,
    status: row.status,
    sortOrder: row.sortOrder,
    publishedAt: iso(row.publishedAt),
    updatedAt: row.updatedAt.toISOString(),
    techTags,
  }
}

export function mapMedia(row: MediaRow): MediaItem {
  return {
    id: row.id,
    filename: row.filename,
    url: row.url,
    pathname: row.pathname,
    mimeType: row.mimeType,
    size: row.size,
    width: row.width,
    height: row.height,
    alt: row.alt,
    createdAt: row.createdAt.toISOString(),
  }
}

export function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    content: row.content,
    read: row.read,
    ip: row.ip,
    userAgent: row.userAgent,
    createdAt: row.createdAt.toISOString(),
  }
}

export function mapSession(row: SessionRow, currentTokenHash: string): SessionInfo {
  return {
    id: row.id,
    ip: row.ip,
    userAgent: row.userAgent,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    current: row.tokenHash === currentTokenHash,
  }
}

export function mapSettings(row: InferSelectModel<typeof schema.siteSettings>): SiteSettings {
  return {
    siteName: row.siteName,
    siteDescription: row.siteDescription,
    logoUrl: row.logoUrl,
    faviconUrl: row.faviconUrl,
    defaultOgImage: row.defaultOgImage,
    footerText: row.footerText,
    icpRecord: row.icpRecord,
    socialShareText: row.socialShareText,
    navConfig: row.navConfig ?? {},
  }
}
