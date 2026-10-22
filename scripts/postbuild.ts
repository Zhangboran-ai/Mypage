import './load-env'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import postgres from 'postgres'
import { SITE_NAME_FALLBACK } from '../shared/constants'

type PostRow = {
  slug: string
  title: string
  summary: string
  cover_url: string | null
  published_at: Date | null
  updated_at: Date
}

type ProjectRow = {
  slug: string
  title: string
  summary: string
  cover_url: string | null
  updated_at: Date
}

type SettingsRow = {
  site_name: string
  site_description: string
  default_og_image: string | null
}

const DIST_DIR = path.resolve('dist')
const ROUTES = [
  { pathname: '/about', title: '关于我', description: '个人介绍、经历与技能。' },
  { pathname: '/projects', title: '项目', description: '参与过的作品与开源项目。' },
  { pathname: '/blog', title: '博客', description: '技术文章与思考记录。' },
  { pathname: '/contact', title: '联系', description: '通过邮箱或留言与我联系。' },
]

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value
}

function resolveSiteUrl(): string {
  const explicit = process.env.PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/$/, '')

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return `https://${vercel}`

  return 'http://localhost:3000'
}

type HeadInput = {
  title: string
  description: string
  url: string
  image?: string | null
  type?: 'website' | 'article'
  publishedAt?: Date | null
  updatedAt?: Date | null
  jsonLd?: Record<string, unknown> | null
  noindex?: boolean
}

function buildHead(input: HeadInput): string {
  const title = escapeHtml(input.title)
  const description = escapeHtml(truncate(input.description, 200))
  const url = escapeHtml(input.url)

  const lines = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="${input.type ?? 'website'}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta name="twitter:card" content="${input.image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
  ]

  if (input.image) {
    const image = escapeHtml(input.image)
    lines.push(`<meta property="og:image" content="${image}" />`)
    lines.push(`<meta name="twitter:image" content="${image}" />`)
  }

  if (input.type === 'article' && input.publishedAt) {
    lines.push(
      `<meta property="article:published_time" content="${input.publishedAt.toISOString()}" />`,
    )
    if (input.updatedAt) {
      lines.push(
        `<meta property="article:modified_time" content="${input.updatedAt.toISOString()}" />`,
      )
    }
  }

  if (input.noindex) lines.push('<meta name="robots" content="noindex,nofollow" />')

  if (input.jsonLd) {
    lines.push(
      `<script type="application/ld+json">${JSON.stringify(input.jsonLd).replaceAll(
        '<',
        '\\u003c',
      )}</script>`,
    )
  }

  lines.push(`<noscript><p>${title}：${description}</p></noscript>`)

  return lines.join('\n    ')
}

function renderShell(baseHtml: string, head: string): string {
  const withoutTitle = baseHtml.replace(/<title>[\s\S]*?<\/title>/i, '')
  if (withoutTitle.includes('<!--app-head-->')) {
    return withoutTitle.replace('<!--app-head-->', head)
  }
  return withoutTitle.replace('</head>', `  ${head}\n  </head>`)
}

type BuildContent = {
  posts: PostRow[]
  projects: ProjectRow[]
  settings: SettingsRow | null
}

const EMPTY_CONTENT: BuildContent = { posts: [], projects: [], settings: null }

async function loadContent(): Promise<BuildContent> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.warn('[postbuild] 未配置 DATABASE_URL，按空内容生成静态壳')
    return EMPTY_CONTENT
  }

  const sql = postgres(databaseUrl, { prepare: false, max: 1, connect_timeout: 10 })

  try {
    const posts = await sql<PostRow[]>`
      select slug, title, summary, cover_url, published_at, updated_at
      from posts
      where deleted_at is null
        and (status = 'PUBLISHED' or (status = 'SCHEDULED' and published_at <= now()))
      order by published_at desc nulls last
      limit 500
    `

    const projects = await sql<ProjectRow[]>`
      select slug, title, summary, cover_url, updated_at
      from projects
      where deleted_at is null
        and (status = 'PUBLISHED' or (status = 'SCHEDULED' and published_at <= now()))
      order by sort_order asc, published_at desc nulls last
      limit 500
    `

    const settingsRows = await sql<SettingsRow[]>`
      select site_name, site_description, default_og_image
      from site_settings
      where id = 'singleton'
      limit 1
    `

    console.info(`[postbuild] 读取到 ${posts.length} 篇文章、${projects.length} 个项目`)

    return { posts, projects, settings: settingsRows[0] ?? null }
  } catch (error) {
    // 构建期数据库不可达（未配置、尚未迁移、网络抖动）时退化为空内容，
    // 静态壳与 robots/sitemap 仍然要产出，不能让整个部署失败。
    console.warn(
      '[postbuild] 数据库查询失败，按空内容生成静态壳：',
      error instanceof Error ? error.message : error,
    )
    return EMPTY_CONTENT
  } finally {
    await sql.end({ timeout: 5 }).catch(() => undefined)
  }
}

async function writePage(relativePath: string, html: string): Promise<void> {
  const filePath = path.join(DIST_DIR, relativePath)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, html, 'utf8')
}

function buildSitemap(
  siteUrl: string,
  posts: PostRow[],
  projects: ProjectRow[],
): string {
  const entries = [
    { loc: '/', lastmod: undefined as string | undefined },
    ...ROUTES.map((route) => ({ loc: route.pathname, lastmod: undefined })),
    ...posts.map((post) => ({
      loc: `/blog/${post.slug}`,
      lastmod: post.updated_at.toISOString(),
    })),
    ...projects.map((project) => ({
      loc: `/projects/${project.slug}`,
      lastmod: project.updated_at.toISOString(),
    })),
  ]

  const urls = entries
    .map((entry) => {
      const parts = [`<loc>${escapeHtml(`${siteUrl}${entry.loc}`)}</loc>`]
      if (entry.lastmod) parts.push(`<lastmod>${entry.lastmod}</lastmod>`)
      return `  <url>${parts.join('')}</url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

function buildRss(
  siteUrl: string,
  settings: SettingsRow | null,
  posts: PostRow[],
): string {
  const name = settings?.site_name ?? SITE_NAME_FALLBACK
  const description = settings?.site_description ?? '个人主页与博客'

  const items = posts
    .slice(0, 20)
    .map((post) => {
      const link = `${siteUrl}/blog/${post.slug}`
      const date = post.published_at ?? post.updated_at
      return [
        '    <item>',
        `      <title>${escapeHtml(post.title)}</title>`,
        `      <link>${escapeHtml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeHtml(link)}</guid>`,
        `      <pubDate>${date.toUTCString()}</pubDate>`,
        `      <description>${escapeHtml(post.summary)}</description>`,
        '    </item>',
      ].join('\n')
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeHtml(name)}</title>
    <link>${siteUrl}</link>
    <description>${escapeHtml(description)}</description>
    <language>zh-CN</language>
${items}
  </channel>
</rss>
`
}

async function main(): Promise<void> {
  const siteUrl = resolveSiteUrl()
  const baseHtml = await readFile(path.join(DIST_DIR, 'index.html'), 'utf8')

  const { posts, projects, settings } = await loadContent()
  const siteName = settings?.site_name ?? SITE_NAME_FALLBACK
  const siteDescription = settings?.site_description ?? '个人主页、作品集与博客'
  const ogImage = settings?.default_og_image ?? null

  for (const route of ROUTES) {
    const head = buildHead({
      title: `${route.title} · ${siteName}`,
      description: route.description,
      url: `${siteUrl}${route.pathname}`,
      image: ogImage,
    })
    await writePage(path.join(route.pathname, 'index.html'), renderShell(baseHtml, head))
  }

  const adminHead = buildHead({
    title: `后台 · ${siteName}`,
    description: '站点后台管理入口。',
    url: `${siteUrl}/admin`,
    noindex: true,
  })
  await writePage('admin/index.html', renderShell(baseHtml, adminHead))

  const notFoundHead = buildHead({
    title: `页面不存在 · ${siteName}`,
    description: siteDescription,
    url: `${siteUrl}/404`,
    noindex: true,
  })
  await writePage('404.html', renderShell(baseHtml, notFoundHead))

  for (const post of posts) {
    const url = `${siteUrl}/blog/${post.slug}`
    const image = post.cover_url ?? ogImage
    const head = buildHead({
      title: `${post.title} · ${siteName}`,
      description: post.summary,
      url,
      image,
      type: 'article',
      publishedAt: post.published_at,
      updatedAt: post.updated_at,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.summary,
        url,
        datePublished: post.published_at?.toISOString(),
        dateModified: post.updated_at.toISOString(),
        image: image ?? undefined,
        author: { '@type': 'Person', name: siteName },
      },
    })
    await writePage(path.join('blog', post.slug, 'index.html'), renderShell(baseHtml, head))
  }

  for (const project of projects) {
    const head = buildHead({
      title: `${project.title} · ${siteName}`,
      description: project.summary,
      url: `${siteUrl}/projects/${project.slug}`,
      image: project.cover_url ?? ogImage,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: project.title,
        description: project.summary,
        url: `${siteUrl}/projects/${project.slug}`,
        dateModified: project.updated_at.toISOString(),
      },
    })
    await writePage(path.join('projects', project.slug, 'index.html'), renderShell(baseHtml, head))
  }

  await writePage('sitemap.xml', buildSitemap(siteUrl, posts, projects))
  await writePage('rss.xml', buildRss(siteUrl, settings, posts))
  await writePage(
    'robots.txt',
    `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
  )

  console.info('[postbuild] 静态壳、sitemap、rss、robots 已生成')
}

// 极端情况下（dist/index.html 缺失或写盘失败）至少保证 robots 与静态 sitemap 存在
async function writeSeoFallback(): Promise<void> {
  const siteUrl = resolveSiteUrl()
  await writePage('sitemap.xml', buildSitemap(siteUrl, [], []))
  await writePage(
    'robots.txt',
    `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
  )
}

// 任何异常都不得阻断部署：失败时退化为纯 SPA
main().catch(async (error: unknown) => {
  console.warn('[postbuild] 生成失败，已退化为纯 SPA：', error)
  try {
    await writeSeoFallback()
    console.warn('[postbuild] 已写入兜底的 robots.txt 与 sitemap.xml')
  } catch (fallbackError) {
    console.warn('[postbuild] 兜底 SEO 文件写入失败：', fallbackError)
  }
  process.exitCode = 0
})
