import '../scripts/load-env'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq, sql } from 'drizzle-orm'
import * as schema from './schema'
import { hashPassword } from '../server/lib/password'
import { toReadingTime } from '../server/lib/reading-time'

const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
const adminPassword = process.env.ADMIN_PASSWORD

if (!databaseUrl) {
  console.error('[seed] 缺少 DATABASE_URL_UNPOOLED 或 DATABASE_URL')
  process.exit(1)
}

if (!adminEmail || !adminPassword || adminPassword.length < 8) {
  console.error('[seed] 请先在 .env.local 配置 ADMIN_EMAIL 与至少 8 位的 ADMIN_PASSWORD')
  process.exit(1)
}

const client = postgres(databaseUrl, { prepare: false, max: 1 })
const db = drizzle(client, { schema })

const samplePostContent = `## 欢迎

这是一篇由 \`pnpm db:seed\` 生成的示例文章，可以直接在后台编辑或删除。

- 支持 GFM 表格、代码块与图片
- 后台预览与前台使用同一套渲染器
- 草稿与定时文章不会出现在公开接口

\`\`\`ts
export function hello(name: string): string {
  return \`你好，\${name}\`
}
\`\`\`
`

async function seedAdmin(): Promise<string> {
  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, adminEmail as string))
    .limit(1)

  if (existing) {
    console.info(`[seed] 管理员已存在，跳过创建：${existing.email}`)
    return existing.id
  }

  const passwordHash = await hashPassword(adminPassword as string)
  const [user] = await db
    .insert(schema.users)
    .values({ email: adminEmail as string, passwordHash, name: '站长', role: 'ADMIN' })
    .returning({ id: schema.users.id })

  console.info(`[seed] 已创建管理员：${adminEmail}`)
  return user.id
}

async function seedProfile(userId: string): Promise<void> {
  const [existing] = await db
    .select({ id: schema.profiles.id })
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .limit(1)

  if (existing) return

  await db.insert(schema.profiles).values({
    userId,
    displayName: '星屿',
    headline: '全栈开发 / 关注开发者体验',
    bio: '在后台「个人信息」里替换这段介绍，支持 Markdown。',
    availability: true,
    statusText: '可接受远程机会',
  })

  console.info('[seed] 已创建默认个人信息')
}

async function seedSettings(): Promise<void> {
  await db
    .insert(schema.siteSettings)
    .values({
      id: 'singleton',
      siteName: '星屿 Astra',
      siteDescription: '一个记录作品、文章与思考的个人空间。',
      navConfig: { about: true, projects: true, blog: true, contact: true },
    })
    .onConflictDoNothing()

  console.info('[seed] 站点设置已就绪')
}

async function seedSkills(): Promise<void> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.skillCategories)

  if ((row?.count ?? 0) > 0) return

  const categories = [
    {
      name: '前端',
      slug: 'frontend',
      sortOrder: 0,
      skills: [
        { name: 'React', icon: '⚛️', level: 90 },
        { name: 'TypeScript', icon: '🔷', level: 88 },
        { name: 'Tailwind CSS', icon: '🎨', level: 85 },
      ],
    },
    {
      name: '后端',
      slug: 'backend',
      sortOrder: 1,
      skills: [
        { name: 'Node.js', icon: '🟩', level: 82 },
        { name: 'Postgres', icon: '🐘', level: 78 },
      ],
    },
    {
      name: '工具',
      slug: 'tools',
      sortOrder: 2,
      skills: [
        { name: 'Vite', icon: '⚡', level: 86 },
        { name: 'Docker', icon: '🐳', level: 70 },
      ],
    },
  ]

  for (const category of categories) {
    const [created] = await db
      .insert(schema.skillCategories)
      .values({
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
      })
      .returning({ id: schema.skillCategories.id })

    await db.insert(schema.skills).values(
      category.skills.map((skill, index) => ({
        categoryId: created.id,
        name: skill.name,
        icon: skill.icon,
        level: skill.level,
        sortOrder: index,
      })),
    )
  }

  console.info('[seed] 已写入示例技能分类')
}

async function seedSampleContent(userId: string): Promise<void> {
  if (process.env.SEED_SAMPLE_DATA !== 'true') {
    console.info('[seed] 未开启 SEED_SAMPLE_DATA，跳过示例文章与项目')
    return
  }

  const [postCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.posts)

  if ((postCount?.count ?? 0) === 0) {
    const [post] = await db
      .insert(schema.posts)
      .values({
        authorId: userId,
        title: '你好，星屿',
        slug: 'hello-astra',
        summary: '一篇示例文章：介绍这个站点能做什么，以及如何在后台发布内容。',
        content: samplePostContent,
        status: 'PUBLISHED',
        readingTime: toReadingTime(samplePostContent),
        publishedAt: new Date(),
      })
      .returning({ id: schema.posts.id })

    const [tag] = await db
      .insert(schema.tags)
      .values({ name: '公告', slug: 'announcement' })
      .onConflictDoNothing()
      .returning({ id: schema.tags.id })

    const tagId =
      tag?.id ??
      (
        await db
          .select({ id: schema.tags.id })
          .from(schema.tags)
          .where(eq(schema.tags.slug, 'announcement'))
          .limit(1)
      )[0]?.id

    if (tagId) {
      await db.insert(schema.postTags).values({ postId: post.id, tagId }).onConflictDoNothing()
    }

    console.info('[seed] 已创建示例文章')
  }

  const [projectCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.projects)

  if ((projectCount?.count ?? 0) === 0) {
    const [project] = await db
      .insert(schema.projects)
      .values({
        title: '星屿 Astra',
        slug: 'astra-homepage',
        summary: '深色星空主题的个人主页，含作品集、博客与单人 CMS。',
        content: '这个站点本身就是第一个项目：React + Hono + Postgres，部署在 Vercel。',
        featured: true,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      })
      .returning({ id: schema.projects.id })

    for (const name of ['React', 'Hono', 'Postgres']) {
      const [tech] = await db
        .insert(schema.techTags)
        .values({ name, slug: name.toLowerCase() })
        .onConflictDoNothing()
        .returning({ id: schema.techTags.id })

      const techId =
        tech?.id ??
        (
          await db
            .select({ id: schema.techTags.id })
            .from(schema.techTags)
            .where(eq(schema.techTags.name, name))
            .limit(1)
        )[0]?.id

      if (techId) {
        await db
          .insert(schema.projectTechTags)
          .values({ projectId: project.id, techId })
          .onConflictDoNothing()
      }
    }

    console.info('[seed] 已创建示例项目')
  }
}

async function main(): Promise<void> {
  const userId = await seedAdmin()
  await seedProfile(userId)
  await seedSettings()
  await seedSkills()
  await seedSampleContent(userId)
  console.info('[seed] 完成')
}

main()
  .catch((error: unknown) => {
    console.error('[seed] 失败', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await client.end({ timeout: 5 })
  })
