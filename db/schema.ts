import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const contentStatus = pgEnum('content_status', ['DRAFT', 'PUBLISHED', 'SCHEDULED'])

const timestamps = () => ({
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('ADMIN'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  ...timestamps(),
})

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ip: varchar('ip', { length: 64 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_idx').on(t.userId), index('sessions_expires_idx').on(t.expiresAt)],
)

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  fullName: varchar('full_name', { length: 100 }),
  headline: varchar('headline', { length: 200 }).notNull(),
  bio: text('bio').notNull(),
  avatarUrl: text('avatar_url'),
  coverUrl: text('cover_url'),
  location: varchar('location', { length: 120 }),
  publicEmail: varchar('public_email', { length: 255 }),
  availability: boolean('availability').notNull().default(false),
  statusText: varchar('status_text', { length: 120 }),
  heroTitle: varchar('hero_title', { length: 120 }),
  heroSubtitle: varchar('hero_subtitle', { length: 300 }),
  resumeUrl: text('resume_url'),
  ...timestamps(),
})

export const socialLinks = pgTable(
  'social_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    platform: varchar('platform', { length: 40 }).notNull(),
    label: varchar('label', { length: 80 }).notNull(),
    url: text('url').notNull(),
    icon: varchar('icon', { length: 80 }),
    sortOrder: integer('sort_order').notNull().default(0),
    visible: boolean('visible').notNull().default(true),
  },
  (t) => [index('social_links_user_sort_idx').on(t.userId, t.sortOrder)],
)

export const experiences = pgTable(
  'experiences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    company: varchar('company', { length: 120 }).notNull(),
    role: varchar('role', { length: 120 }).notNull(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [index('experiences_user_sort_idx').on(t.userId, t.sortOrder)],
)

export const skillCategories = pgTable('skill_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 60 }).notNull(),
  slug: varchar('slug', { length: 60 }).notNull().unique(),
  sortOrder: integer('sort_order').notNull().default(0),
  visible: boolean('visible').notNull().default(true),
})

export const skills = pgTable(
  'skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => skillCategories.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 60 }).notNull(),
    icon: varchar('icon', { length: 80 }),
    level: integer('level').notNull().default(60),
    levelLabel: varchar('level_label', { length: 30 }),
    sortOrder: integer('sort_order').notNull().default(0),
    visible: boolean('visible').notNull().default(true),
  },
  (t) => [index('skills_category_sort_idx').on(t.categoryId, t.sortOrder)],
)

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 120 }).notNull(),
    slug: varchar('slug', { length: 80 }).notNull().unique(),
    summary: varchar('summary', { length: 300 }).notNull(),
    content: text('content'),
    coverUrl: text('cover_url'),
    repoUrl: text('repo_url'),
    demoUrl: text('demo_url'),
    role: varchar('role', { length: 120 }),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    featured: boolean('featured').notNull().default(false),
    status: contentStatus('status').notNull().default('DRAFT'),
    sortOrder: integer('sort_order').notNull().default(0),
    seoTitle: varchar('seo_title', { length: 150 }),
    seoDescription: varchar('seo_description', { length: 300 }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [index('projects_visibility_idx').on(t.status, t.featured, t.sortOrder)],
)

export const projectImages = pgTable(
  'project_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    alt: varchar('alt', { length: 200 }),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [index('project_images_project_sort_idx').on(t.projectId, t.sortOrder)],
)

export const techTags = pgTable('tech_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 40 }).notNull().unique(),
  slug: varchar('slug', { length: 40 }).notNull().unique(),
})

export const projectTechTags = pgTable(
  'project_tech_tags',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    techId: uuid('tech_id')
      .notNull()
      .references(() => techTags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.techId] })],
)

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id),
    title: varchar('title', { length: 150 }).notNull(),
    slug: varchar('slug', { length: 80 }).notNull().unique(),
    summary: varchar('summary', { length: 300 }).notNull(),
    content: text('content').notNull(),
    coverUrl: text('cover_url'),
    status: contentStatus('status').notNull().default('DRAFT'),
    pinned: boolean('pinned').notNull().default(false),
    readingTime: integer('reading_time').notNull().default(0),
    views: integer('views').notNull().default(0),
    seoTitle: varchar('seo_title', { length: 150 }),
    seoDescription: varchar('seo_description', { length: 300 }),
    ogImage: text('og_image'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index('posts_visibility_idx').on(t.status, t.pinned, t.publishedAt),
    index('posts_updated_idx').on(t.updatedAt),
  ],
)

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 40 }).notNull().unique(),
  slug: varchar('slug', { length: 40 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const postTags = pgTable(
  'post_tags',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] }), index('post_tags_tag_idx').on(t.tagId)],
)

export const media = pgTable(
  'media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    filename: varchar('filename', { length: 255 }).notNull(),
    url: text('url').notNull().unique(),
    pathname: text('pathname').notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    size: integer('size').notNull(),
    width: integer('width'),
    height: integer('height'),
    alt: varchar('alt', { length: 300 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('media_created_idx').on(t.createdAt)],
)

export const siteSettings = pgTable('site_settings', {
  id: varchar('id', { length: 20 }).primaryKey().default('singleton'),
  siteName: varchar('site_name', { length: 100 }).notNull(),
  siteDescription: varchar('site_description', { length: 300 }).notNull(),
  logoUrl: text('logo_url'),
  faviconUrl: text('favicon_url'),
  defaultOgImage: text('default_og_image'),
  footerText: varchar('footer_text', { length: 300 }),
  icpRecord: varchar('icp_record', { length: 120 }),
  navConfig: jsonb('nav_config').$type<Record<string, boolean>>(),
  socialShareText: varchar('social_share_text', { length: 200 }),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const contactMessages = pgTable(
  'contact_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 80 }).notNull(),
    email: varchar('email', { length: 255 }),
    content: text('content').notNull(),
    read: boolean('read').notNull().default(false),
    ip: varchar('ip', { length: 64 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('contact_messages_read_idx').on(t.read, t.createdAt)],
)

export const loginAttempts = pgTable(
  'login_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    identifier: varchar('identifier', { length: 320 }).notNull(),
    ip: varchar('ip', { length: 64 }),
    success: boolean('success').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('login_attempts_lookup_idx').on(t.identifier, t.createdAt)],
)
