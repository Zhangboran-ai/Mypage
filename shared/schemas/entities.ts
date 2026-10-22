import { z } from 'zod'
import { contentStatusSchema } from './post'

const dateString = z.string()
const nullableDateString = dateString.nullable()
const nullableString = z.string().nullable()

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.string(),
})

export const profileSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  fullName: nullableString,
  headline: z.string(),
  bio: z.string(),
  avatarUrl: nullableString,
  coverUrl: nullableString,
  location: nullableString,
  publicEmail: nullableString,
  availability: z.boolean(),
  statusText: nullableString,
  heroTitle: nullableString,
  heroSubtitle: nullableString,
  resumeUrl: nullableString,
  updatedAt: dateString,
})

export const socialLinkSchema = z.object({
  id: z.string(),
  platform: z.string(),
  label: z.string(),
  url: z.string(),
  icon: nullableString,
  sortOrder: z.number(),
  visible: z.boolean(),
})

export const experienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  startDate: dateString,
  endDate: nullableDateString,
  description: nullableString,
  sortOrder: z.number(),
})

export const skillSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  name: z.string(),
  icon: nullableString,
  level: z.number(),
  levelLabel: nullableString,
  sortOrder: z.number(),
  visible: z.boolean(),
})

export const skillCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  sortOrder: z.number(),
  visible: z.boolean(),
  skills: z.array(skillSchema),
})

export const publicProfileSchema = z.object({
  profile: profileSchema.nullable(),
  socialLinks: z.array(socialLinkSchema),
  experiences: z.array(experienceSchema),
  skillCategories: z.array(skillCategorySchema),
})

export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
})

export const tagWithCountSchema = tagSchema.extend({ count: z.number() })

export const techTagSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
})

export const postListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  summary: z.string(),
  coverUrl: nullableString,
  status: contentStatusSchema,
  pinned: z.boolean(),
  readingTime: z.number(),
  views: z.number(),
  publishedAt: nullableDateString,
  updatedAt: dateString,
  tags: z.array(tagSchema),
})

export const postNeighborSchema = z.object({
  title: z.string(),
  slug: z.string(),
})

export const postDetailSchema = postListItemSchema.extend({
  content: z.string(),
  seoTitle: nullableString,
  seoDescription: nullableString,
  ogImage: nullableString,
  prev: postNeighborSchema.nullable(),
  next: postNeighborSchema.nullable(),
  related: z.array(postListItemSchema),
})

export const projectCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  summary: z.string(),
  coverUrl: nullableString,
  repoUrl: nullableString,
  demoUrl: nullableString,
  role: nullableString,
  startDate: nullableDateString,
  endDate: nullableDateString,
  featured: z.boolean(),
  status: contentStatusSchema,
  sortOrder: z.number(),
  publishedAt: nullableDateString,
  updatedAt: dateString,
  techTags: z.array(techTagSchema),
})

export const projectDetailSchema = projectCardSchema.extend({
  content: nullableString,
  seoTitle: nullableString,
  seoDescription: nullableString,
  images: z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      alt: nullableString,
      sortOrder: z.number(),
    }),
  ),
})

export const siteSettingsSchema = z.object({
  siteName: z.string(),
  siteDescription: z.string(),
  logoUrl: nullableString,
  faviconUrl: nullableString,
  defaultOgImage: nullableString,
  footerText: nullableString,
  icpRecord: nullableString,
  socialShareText: nullableString,
  navConfig: z.record(z.string(), z.boolean()),
})

export const mediaSchema = z.object({
  id: z.string(),
  filename: z.string(),
  url: z.string(),
  pathname: z.string(),
  mimeType: z.string(),
  size: z.number(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  alt: nullableString,
  createdAt: dateString,
})

export const messageSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: nullableString,
  content: z.string(),
  read: z.boolean(),
  ip: nullableString,
  userAgent: nullableString,
  createdAt: dateString,
})

export const sessionInfoSchema = z.object({
  id: z.string(),
  ip: nullableString,
  userAgent: nullableString,
  createdAt: dateString,
  expiresAt: dateString,
  current: z.boolean(),
})

export const dashboardSchema = z.object({
  stats: z.object({
    posts: z.number(),
    drafts: z.number(),
    projects: z.number(),
    skills: z.number(),
    unreadMessages: z.number(),
  }),
  recentPosts: z.array(postListItemSchema),
})

export type AuthUser = z.infer<typeof authUserSchema>
export type Profile = z.infer<typeof profileSchema>
export type SocialLink = z.infer<typeof socialLinkSchema>
export type Experience = z.infer<typeof experienceSchema>
export type Skill = z.infer<typeof skillSchema>
export type SkillCategory = z.infer<typeof skillCategorySchema>
export type PublicProfile = z.infer<typeof publicProfileSchema>
export type Tag = z.infer<typeof tagSchema>
export type TagWithCount = z.infer<typeof tagWithCountSchema>
export type TechTag = z.infer<typeof techTagSchema>
export type PostListItem = z.infer<typeof postListItemSchema>
export type PostDetail = z.infer<typeof postDetailSchema>
export type AdminPostDetail = PostListItem & {
  content: string
  seoTitle: string | null
  seoDescription: string | null
  ogImage: string | null
  tagIds: string[]
}
export type ProjectCard = z.infer<typeof projectCardSchema>
export type ProjectDetail = z.infer<typeof projectDetailSchema>
export type AdminProjectDetail = ProjectDetail & { techTagNames: string[] }
export type SiteSettings = z.infer<typeof siteSettingsSchema>
export type MediaItem = z.infer<typeof mediaSchema>
export type Message = z.infer<typeof messageSchema>
export type SessionInfo = z.infer<typeof sessionInfoSchema>
export type Dashboard = z.infer<typeof dashboardSchema>
