# 个人展示网站 技术方案（TECH_DESIGN）

| 项目 | 内容 |
| --- | --- |
| 文档版本 | v2.0（Vercel 部署版） |
| 更新日期 | 2026-10-22 |
| 关联文档 | `PRD.md`（需求）、`AGENTS.md`（AI 开发规范） |
| 架构风格 | 单仓库、单 Vercel 项目；静态前端 + Serverless API + 托管 Postgres |
| 部署目标 | Vercel（Production / Preview），Neon Postgres，Vercel Blob |

> v2.0 的核心变化：放弃「独立常驻 Node 服务 + 本地文件存储 + Monorepo 双应用」的结构，改为**一个 Vercel 项目内同时部署前端与 API**。这样只需连接一次 Git 仓库、配置一组环境变量即可上线，不需要额外购买或运维服务器。

---

## 1. 技术栈选择

### 1.1 总览

| 层 | 选型 | 选型理由（面向 Vercel） |
| --- | --- | --- |
| 前端框架 | **React 19 + TypeScript 5（strict）** | 需求指定；生态成熟 |
| 构建工具 | **Vite 7** | Vercel 原生识别，产物为纯静态文件，直接走 CDN |
| 路由 | **React Router 7（`createBrowserRouter`）** | SPA 路由；配合 Vercel rewrite 做回退 |
| 服务端状态 | **TanStack Query 5** | 缓存、重试、失效；减少对函数的热请求 |
| 客户端状态 | **Zustand 5** | 仅存 UI 状态（侧边栏、编辑器标记） |
| 样式 | **Tailwind CSS 4 + CSS Variables** | 构建期产出静态 CSS，无运行时开销 |
| 组件基础 | **Radix UI Primitives**（shadcn/ui 风格，代码内联） | 无障碍可靠，不引入黑盒组件库 |
| 动效 | **Motion（原 Framer Motion）** | 支持 `useReducedMotion`，只动 `transform/opacity` |
| 图标 | **lucide-react** | 按需 tree-shake |
| Markdown 渲染 | **react-markdown + remark-gfm + rehype-sanitize + @shikijs/rehype** | 净化防 XSS + GFM + 构建/客户端高亮 |
| Markdown 编辑 | **textarea + 工具栏**（可选 CodeMirror 6） | 单人使用，避免重型编辑器 |
| 表单 | **React Hook Form + Zod** | 与后端共享 schema |
| API 框架 | **Hono 4** | 基于 Web 标准，体积极小（~20KB），单文件即可承载全部路由；Vercel 一等支持，冷启动低 |
| 函数入口 | **`api/[...route].ts`（Vercel Node.js Function）** | 所有 `/api/*` 收敛为一个函数，符合 Vercel「少函数、共享实例」的建议 |
| ORM | **Drizzle ORM + `postgres.js`** | 无代码生成二进制、体积极小、支持事务；Serverless 冷启动远低于 Prisma |
| 数据库 | **Neon Postgres 16**（Vercel Marketplace） | Serverless Postgres，支持分支；与 Vercel 一键集成并自动注入环境变量 |
| 文件存储 | **Vercel Blob** | 无持久磁盘场景的唯一合理选择；浏览器直传，绕过 4.5MB 请求体限制 |
| 校验 | **Zod 4** | 前后端共享 |
| 鉴权 | **数据库会话 + HttpOnly Cookie** | 同域部署，无需 CORS；会话可吊销 |
| 密码哈希 | **`@noble/hashes` 的 argon2id（纯 JS）** | 无原生二进制，Vercel 各区域均可运行 |
| 日志 | **Hono `logger` + Vercel Runtime Logs** | 无需自建日志服务 |
| 测试 | **Vitest + React Testing Library + `app.request()` + Playwright** | Hono 可在内存中直接发请求，无需起服务 |
| 代码质量 | **ESLint 9 + Prettier + `tsc --noEmit` + husky + lint-staged** | 提交前拦截 |
| 包管理 | **pnpm（单包，不使用 workspaces）** | Vercel 自动识别 `pnpm-lock.yaml`；单包配置最少 |
| Node 版本 | **Node.js 22 LTS** | Vercel 支持；`package.json` 的 `engines.node` 固定 |
| CI | **GitHub Actions**（可选） | lint / typecheck / test；部署交给 Vercel Git 集成 |

### 1.2 关键取舍

| 备选 | 不采用的原因 |
| --- | --- |
| 独立 Fastify/Express 服务部署在 Railway/Fly | 需要第二个平台、第二套域名与 CORS；与「方便部署到 Vercel」目标冲突 |
| Next.js 全栈 | 能一站式解决 SSR/SEO，但与需求指定的 Vite 不符；本项目页面量小，Vite 静态站 + 预渲染足够 |
| Prisma | Serverless 下需打包查询引擎、冷启动更慢；迁移需额外步骤；本方案用 Drizzle 更轻 |
| `drizzle-orm/neon-http` | HTTP 驱动不支持交互式事务，而「文章 + 标签」「项目 + 技术栈」需要事务 |
| SQLite / 本地文件数据库 | Vercel 无持久磁盘，实例重启即丢数据 |
| 本地 `uploads/` 目录 | 同上；Serverless 文件系统只读且临时 |
| 第三方图床（Cloudinary 等） | 多一个账号与密钥；Vercel Blob 已随项目提供 |
| JWT 存 localStorage | XSS 风险、无法主动吊销；同域 Cookie 更简单安全 |
| pnpm Monorepo（web/api 分离） | Vercel 需建两个项目并处理跨域与 Cookie，部署与调试成本更高 |
| TipTap / 富文本 | 技术博客以代码为主，Markdown 更可移植、更易做版本管理 |

### 1.3 成本与额度（按免费计划估算，具体以官网为准）

| 服务 | 免费额度关注点 | 本项目影响 |
| --- | --- | --- |
| Vercel Hobby | 函数调用次数、带宽、构建次数 | 个人站流量足够；构建次数需注意「每次发布触发重建」 |
| Neon Free | 存储 0.5GB、计算自动休眠 | 内容量小；休眠后首个请求有数百毫秒冷启动 |
| Vercel Blob | 存储与流量额度 | 图片压缩后单张 100–300KB，足够长期使用 |

---

## 2. 系统架构

```mermaid
flowchart LR
    U[访客 / 管理员浏览器]

    subgraph V[Vercel 项目（同一域名）]
        CDN[静态资源 CDN<br/>dist/*]
        FN[Serverless Function<br/>api/[...route].ts<br/>Hono]
    end

    NEON[(Neon Postgres)]
    BLOB[(Vercel Blob)]
    GH[GitHub 仓库]

    GH -->|push / PR| V
    U -->|HTML/CSS/JS| CDN
    U -->|/api/*| FN
    U -->|图片直传| BLOB
    FN --> NEON
    FN -->|签发上传令牌 / 删除| BLOB
```

### 2.1 同域带来的简化

- 前端与 API 同域：无需 CORS，Cookie 直接生效，`SameSite=Lax` 即可防大部分 CSRF。
- 前端请求使用相对路径 `/api/...`，不需要 `VITE_API_BASE_URL`，也不存在跨域预检。
- 生产、预览、本地都遵循同一套路径规则。

### 2.2 请求路径约定

| 前缀 | 用途 | 缓存策略 |
| --- | --- | --- |
| `/`、`/blog/*`、`/projects/*` | 静态页面（构建产物） | CDN 长期缓存带哈希资源；HTML 短缓存 |
| `/api/public/*` | 公开只读数据 | `public, s-maxage=60, stale-while-revalidate=300` |
| `/api/auth/*` | 登录、登出、当前用户 | `no-store` |
| `/api/admin/*` | 后台读写、上传令牌 | `no-store` |
| `/api/health` | 探活 | `no-store` |

### 2.3 渲染与 SEO 策略

采用「**SPA + 构建期静态壳预渲染**」，不引入 SSR 服务：

1. `vite build` 产出 `dist/`，Vercel 直接作为静态站发布。
2. `scripts/postbuild.ts` 在构建后连接数据库，读取已发布的文章/项目 slug，为每个详情页复制 `index.html` 并注入：
   - `<title>`、`meta description`、canonical；
   - `og:*`、`twitter:card`；
   - 文章页 `Article` JSON-LD；
   - `<noscript>` 中的标题与摘要（不注入完整正文）。
3. 同一脚本生成 `sitemap.xml`、`rss.xml`、`robots.txt`。
4. 脚本整体 `try/catch`：数据库不可达或变量缺失时**只记录日志并正常退出**，部署继续，站点退化为纯 SPA。
5. 前端每个页面仍通过组件设置 `document.title` 与 meta，保证站内跳转时信息正确。

局限与后续升级：
- 首屏 HTML 不含文章正文，正文由客户端渲染。Google 可执行 JS，影响可控；对正文收录要求极高时，再升级为完整 SSG（Vike）或 Next.js。
- 新文章发布后，需要一次重新构建才能更新静态详情页与 sitemap。可在后台「发布」成功后调用 Vercel Deploy Hook 触发重建（可选）。

---

## 3. 项目结构

单包结构，不使用 workspace：

```
Mypage/
├─ api/
│  └─ [...route].ts              # 唯一的 Vercel Function 入口（/api/*）
│
├─ server/                       # 后端业务代码（不会各自变成函数）
│  ├─ app.ts                     # Hono 实例 + basePath('/api') + 中间件挂载
│  ├─ dev.ts                     # 本地独立运行 API（@hono/node-server）
│  ├─ env.ts                     # 环境变量 Zod 校验
│  ├─ routes/
│  │  ├─ public.ts               # 公开读取
│  │  ├─ auth.ts                 # 登录 / 登出 / me / 改密
│  │  ├─ admin.ts                # 后台聚合路由（挂鉴权）
│  │  ├─ admin-posts.ts
│  │  ├─ admin-projects.ts
│  │  ├─ admin-profile.ts
│  │  ├─ admin-skills.ts
│  │  ├─ admin-media.ts          # 含 Blob 上传令牌
│  │  ├─ admin-settings.ts
│  │  └─ admin-messages.ts
│  ├─ services/                  # 业务规则 + 数据库读写（不含 HTTP 上下文）
│  │  ├─ post-service.ts
│  │  ├─ project-service.ts
│  │  ├─ profile-service.ts
│  │  ├─ skill-service.ts
│  │  ├─ media-service.ts
│  │  └─ setting-service.ts
│  ├─ middleware/
│  │  ├─ auth.ts                 # 会话校验，注入 c.set('user')
│  │  ├─ csrf.ts                 # 写操作 Origin 校验
│  │  ├─ rate-limit.ts           # 基于数据库的失败计数
│  │  └─ error-handler.ts        # 领域错误 → HTTP 状态
│  └─ lib/
│     ├─ db.ts                   # Drizzle + postgres.js 单例
│     ├─ session.ts              # token 生成/哈希/Cookie
│     ├─ password.ts             # argon2id 哈希与校验
│     ├─ slug.ts                 # slug 生成与唯一化
│     ├─ pagination.ts
│     ├─ storage.ts              # Vercel Blob 删除、元数据
│     └─ reading-time.ts
│
├─ db/
│  ├─ schema.ts                  # Drizzle schema（唯一事实来源）
│  ├─ migrations/                # drizzle-kit 生成
│  └─ seed.ts                    # 管理员 + 示例内容
│
├─ shared/                       # 前后端共享（纯 TS + Zod，不依赖框架）
│  ├─ schemas/                   # post / project / profile / skill / media / settings
│  ├─ types/                     # z.infer 导出的 DTO、ApiResponse、Paginated
│  ├─ constants.ts               # 状态枚举、分页上限、上传限制
│  └─ index.ts
│
├─ scripts/
│  ├─ postbuild.ts               # 静态壳预渲染 + sitemap + rss
│  └─ deploy-hook.ts             # 可选：发布后触发 Vercel 重建
│
├─ src/                          # 前端
│  ├─ app/
│  │  ├─ router.tsx              # 路由表 + 懒加载 + 守卫 + errorElement
│  │  ├─ providers.tsx
│  │  └─ layouts/                # PublicLayout / AdminLayout
│  ├─ components/
│  │  ├─ ui/                     # 无业务原子组件
│  │  ├─ layout/                 # Navbar / Footer / Container / Section
│  │  ├─ background/             # StarField / Nebula / Meteor
│  │  └─ common/                 # Seo / EmptyState / ErrorState / Skeleton
│  ├─ features/
│  │  ├─ home/ about/ skills/ projects/ blog/
│  │  └─ admin/                  # auth / dashboard / profile / skills / projects
│  │                             # posts / media / messages / settings / account
│  ├─ lib/
│  │  ├─ api.ts                  # 唯一 HTTP 出口，同源 /api
│  │  ├─ query.ts                # query key 工厂
│  │  ├─ markdown.tsx            # 全站唯一 Markdown 渲染器
│  │  ├─ seo.ts                  # 客户端 title/meta 更新
│  │  ├─ format.ts               # 日期（Asia/Shanghai）、阅读时长
│  │  ├─ image.ts                # 上传前压缩（Canvas → WebP）
│  │  └─ constants.ts
│  ├─ hooks/                     # useAutosave / useMediaQuery / useScrollProgress
│  ├─ styles/                    # tokens.css / globals.css / prose.css
│  ├─ types/
│  ├─ main.tsx
│  └─ env.ts                     # 仅 VITE_ 公开变量
│
├─ public/
│  ├─ favicon.svg
│  └─ og-default.png
│
├─ index.html                    # 含 <!--app-head--> 占位，供 postbuild 注入
├─ vite.config.ts                # alias: @ → src, @shared → shared; /api 代理
├─ tailwind.config.ts
├─ drizzle.config.ts
├─ vercel.json                   # 路由回退、函数、缓存、安全头
├─ tsconfig.json
├─ eslint.config.js
├─ package.json
├─ pnpm-lock.yaml
├─ .env.example
├─ README.md
├─ PRD.md
├─ TECH_DESIGN.md
└─ AGENTS.md
```

### 3.1 结构规则

1. **`/api` 目录只放入口文件**。Vercel 会把 `api/` 下每个源文件都当成独立函数；业务代码一律放 `server/`，由入口 import。
2. `server/` 与 `api/` **不能使用 `@/` 或 tsconfig paths**（Vercel 函数构建不支持路径映射），只能使用相对路径。
3. `src/` 内使用 `@/` 指向 `src/`、`@shared/` 指向 `shared/`；`vite.config.ts` 与 `tsconfig.json` 同时配置。
4. `shared/` 只能是纯 TypeScript + Zod，禁止依赖 React、Hono、Drizzle、Node API。
5. `server/services` 不接触 `Request`/`Response`；`server/routes` 不写复杂查询。
6. `src/components/ui` 不含业务语义，不调用 API。
7. 前台与后台共用 `src/lib/markdown.tsx` 与设计令牌，但布局与导航各自独立。

---

## 4. 数据模型

### 4.1 实体关系

```mermaid
erDiagram
    users ||--o{ sessions : has
    users ||--|| profiles : owns
    users ||--o{ experiences : has
    users ||--o{ social_links : has
    users ||--o{ posts : writes
    skill_categories ||--o{ skills : contains
    posts }o--o{ tags : tagged
    projects }o--o{ tech_tags : uses
    projects ||--o{ project_images : has
    media ||..o{ posts : "URL 引用（无外键）"
```

### 4.2 Drizzle Schema（权威定义）

```ts
// db/schema.ts
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

// 每张表调用一次，避免复用同一个列构造器
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
  (t) => [
    index('sessions_user_idx').on(t.userId),
    index('sessions_expires_idx').on(t.expiresAt),
  ],
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
```

### 4.3 数据库连接

```ts
// server/lib/db.ts
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from '../../db/schema'
import { env } from '../env'

// 使用 Neon 的 pooled 连接串；prepare: false 是 PgBouncer/Neon pooler 的要求
const client = postgres(env.DATABASE_URL, {
  prepare: false,
  max: 3,
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle(client, { schema })
```

说明：选择 `postgres.js` 而非 Neon HTTP 驱动，是为了获得**交互式事务**能力；代价是每个函数实例维持少量 TCP 连接，由 Neon 连接池统一收敛。个人站并发很低，`max: 3` 足够。

### 4.4 数据约束与业务规则

| 规则 | 说明 |
| --- | --- |
| 单管理员 | `users` 仅一条 `role = 'ADMIN'`；不提供注册接口 |
| 唯一性 | `email`、`slug`（posts / projects / tags / tech_tags）、`media.url` 唯一；slug 仅允许 `a-z0-9-`，长度 1–80 |
| 可见性 | 公开查询统一使用 `deletedAt IS NULL` +（`PUBLISHED` 或 `SCHEDULED` 且 `publishedAt <= now()`） |
| 定时发布 | 不依赖 Cron：读取时按时间判断；后台「发布时间」到达后自动出现在前台。发布后如需刷新静态页，调用 Deploy Hook |
| 软删除 | 文章、项目只写 `deletedAt`；所有查询默认过滤 |
| 事务 | 「文章 + 标签」「项目 + 技术栈」写入必须在 `db.transaction()` 内完成 |
| 排序 | `sortOrder` 升序，值相同按 `id` 兜底，保证稳定 |
| 阅读时长 | `ceil((中文字符数 + 英文单词数) / 300)`，最少 1 分钟 |
| 时间 | 数据库 `timestamptz` 存 UTC；展示统一 `Asia/Shanghai` |
| 媒体 | 只存 Blob URL 与元数据；删除记录时调用 `del()`，删除前检查是否被文章/项目引用 |

---

## 5. API 设计

统一响应：

```ts
type ApiSuccess<T> = { data: T }
type ApiError = { error: { code: string; message: string; details?: unknown } }
type Paginated<T> = {
  data: T[]
  meta: { page: number; pageSize: number; total: number; totalPages: number }
}
```

分页参数 `?page=1&pageSize=12`，`pageSize` 上限 50。

### 5.1 公开接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/public/profile` | 个人信息 + 社交链接 + 履历 + 技能分类/技能 |
| GET | `/api/public/projects?featured=&tech=&page=` | 已发布项目列表 |
| GET | `/api/public/projects/:slug` | 项目详情 |
| GET | `/api/public/posts?tag=&q=&page=` | 已发布文章列表（不含正文） |
| GET | `/api/public/posts/:slug` | 文章详情（正文、上下篇、相关文章） |
| GET | `/api/public/tags` | 标签及文章数 |
| GET | `/api/public/settings` | 站点设置（字段白名单） |
| GET | `/api/public/sitemap-data` | 仅构建期使用；生产可关闭或加缓存 |
| POST | `/api/public/messages` | 留言（蜜罐 + 数据库限流 + 长度限制） |
| GET | `/api/health` | `{ status, db }` |

### 5.2 鉴权接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/auth/login` | `{ email, password, remember? }`；成功 Set-Cookie |
| POST | `/api/auth/logout` | 删除会话并清 Cookie |
| GET | `/api/auth/me` | 当前用户；未登录 401 |
| POST | `/api/auth/change-password` | `{ currentPassword, newPassword }`，成功后吊销其他会话 |

### 5.3 管理接口（均需会话）

| 资源 | 端点 |
| --- | --- |
| 仪表盘 | `GET /api/admin/dashboard` |
| 个人信息 | `GET/PUT /api/admin/profile`；`POST/PUT/DELETE /api/admin/social-links[/:id]`；`POST/PUT/DELETE /api/admin/experiences[/:id]` |
| 技能 | `POST/PUT/DELETE /api/admin/skill-categories[/:id]`；`POST/PUT/DELETE /api/admin/skills[/:id]`；`PUT /api/admin/skills/reorder` |
| 项目 | `GET/POST /api/admin/projects`；`GET/PUT/DELETE /api/admin/projects/:id`；`PUT /api/admin/projects/reorder` |
| 文章 | `GET/POST /api/admin/posts`；`GET/PUT/DELETE /api/admin/posts/:id`；`POST /api/admin/posts/:id/publish`；`POST /api/admin/posts/:id/unpublish` |
| 标签 | `GET/POST/PUT/DELETE /api/admin/tags[/:id]` |
| 媒体 | `POST /api/admin/media/upload`（Blob 客户端上传令牌）；`POST /api/admin/media`（确认并入库）；`GET /api/admin/media`；`DELETE /api/admin/media/:id` |
| 留言 | `GET /api/admin/messages`；`PATCH /api/admin/messages/:id`；`DELETE /api/admin/messages/:id` |
| 设置 | `GET/PUT /api/admin/settings` |
| 账号 | `GET /api/admin/account/sessions`；`DELETE /api/admin/account/sessions/:id` |

### 5.4 错误码

| 场景 | HTTP | code |
| --- | --- | --- |
| 参数错误 | 400 | `VALIDATION_ERROR` |
| 未登录 | 401 | `UNAUTHORIZED` |
| Origin 不合法 / 无权限 | 403 | `FORBIDDEN` |
| 资源不存在 | 404 | `NOT_FOUND` |
| 唯一性冲突 | 409 | `CONFLICT` |
| 版本冲突（乐观锁） | 409 | `STALE_CONTENT` |
| 限流 / 登录锁定 | 429 | `RATE_LIMITED` |
| 文件超限 / 类型不支持 | 413 / 415 | `PAYLOAD_TOO_LARGE` / `UNSUPPORTED_MEDIA_TYPE` |
| 未预期错误 | 500 | `INTERNAL_ERROR` |

---

## 6. Vercel 部署设计

### 6.1 单项目如何同时跑前端与 API

- Vercel 识别为 **Vite 框架**：执行 `pnpm build`，发布 `dist/` 静态文件。
- 根目录 `api/[...route].ts` 被识别为 **Vercel Function**：所有 `/api/*` 请求进入同一个 Hono 实例。
- 两者同域名、同一次部署，无需第二个项目、无需 CORS。

函数入口：

```ts
// api/[...route].ts
import { app } from '../server/app'

// Vercel Node.js Runtime 支持 Web 标准 fetch 签名
export default {
  fetch: (request: Request) => app.fetch(request),
}
```

Hono 实例：

```ts
// server/app.ts
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { publicRoutes } from './routes/public'
import { authRoutes } from './routes/auth'
import { adminRoutes } from './routes/admin'
import { onError } from './middleware/error-handler'

export const app = new Hono().basePath('/api')

app.use(logger())
app.use(secureHeaders())
app.onError(onError)

app.route('/public', publicRoutes)
app.route('/auth', authRoutes)
app.route('/admin', adminRoutes)
```

本地若不想用 `vercel dev`，可用 `server/dev.ts` 启动同一实例：

```ts
// server/dev.ts
import { serve } from '@hono/node-server'
import { app } from './app'

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`)
})
```

### 6.2 `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/:path((?!api/).*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

要点：
- 回退规则排除 `/api/`，API 请求不会被改写成 HTML。
- 已存在的静态文件（含预渲染的 `/blog/xxx/index.html`）优先于回退规则。
- 不在 `functions` 里配置带方括号的文件名，避免 glob 解析问题；超时时间可在 Vercel 项目设置中调整。

### 6.3 环境变量

| 变量 | 来源 | 用途 |
| --- | --- | --- |
| `DATABASE_URL` | Neon 集成自动注入（pooled） | 运行时数据库连接 |
| `DATABASE_URL_UNPOOLED` | Neon 集成自动注入（direct） | `drizzle-kit` 迁移、seed |
| `BLOB_READ_WRITE_TOKEN` | Blob 存储自动注入 | 服务端删除文件、签发上传令牌 |
| `BLOB_STORE_ID` / `VERCEL_OIDC_TOKEN` | Blob 存储自动注入 | 新版 OIDC 访问方式，SDK 自动读取 |
| `PUBLIC_SITE_URL` | 手动填写（可选） | canonical、OG、sitemap 的绝对地址；缺省回退到 `https://$VERCEL_PROJECT_PRODUCTION_URL` |
| `ADMIN_EMAIL` | 手动填写 | 仅 `db:seed` 使用 |
| `ADMIN_PASSWORD` | 手动填写 | 仅 `db:seed` 使用 |
| `DEPLOY_HOOK_URL` | 可选，Vercel Deploy Hook | 发布内容后触发静态站重建 |
| `VERCEL_ENV`、`VERCEL_URL`、`VERCEL_PROJECT_PRODUCTION_URL` | Vercel 系统注入 | 判断环境、生成预览/生产绝对 URL |

`.env.example`：

```dotenv
# 数据库（Neon）
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Vercel Blob
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx

# 站点
PUBLIC_SITE_URL=http://localhost:3000

# 仅 seed 使用
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123456
SEED_SAMPLE_DATA=false

# 可选：发布后触发重建
DEPLOY_HOOK_URL=

# 可选：API 集成测试数据库
DATABASE_URL_TEST=
```

注意：
- 创建 Neon 与 Blob 资源时，勾选 **Development / Preview / Production** 三个环境，`vercel env pull` 才能拉到本地开发所需变量。
- Preview 建议使用独立的 Neon 分支与 Blob Store，避免预览站写入生产数据。
- 前端只能读取 `VITE_` 前缀变量，**任何密钥都不得加 `VITE_`**。
- 本项目前端不需要 API 地址变量，统一使用同源 `/api`。

### 6.4 构建流程

`package.json`：

```json
{
  "type": "module",
  "engines": { "node": "22.x" },
  "scripts": {
    "dev": "vercel dev",
    "dev:web": "vite",
    "dev:api": "tsx watch server/dev.ts",
    "build": "vite build && tsx scripts/postbuild.ts",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx db/seed.ts",
    "db:studio": "drizzle-kit studio"
  }
}
```

构建阶段顺序：
1. Vercel 安装依赖（pnpm，锁定文件）。
2. `vite build` → `dist/`。
3. `tsx scripts/postbuild.ts` → 查询数据库、生成详情页静态壳、`sitemap.xml`、`rss.xml`。
4. Vercel 发布 `dist/` 并部署函数。

注意事项：
- 构建期需要 `DATABASE_URL`（Preview 与 Production 各自配置）。数据库缺失或查询失败时，postbuild 按空内容继续生成静态壳、`robots.txt`、`sitemap.xml`（只含固定路由）与空 `rss.xml`，不影响部署；只有写盘失败才整体降级为纯 SPA，此时也会尽力写出兜底的 robots 与 sitemap。
- **不要**在构建命令里跑数据库迁移。迁移在本地或 CI 中执行一次，避免并发构建重复写入。
- 本地脚本（`server/dev.ts`、`db/seed.ts`、`scripts/postbuild.ts`、`drizzle.config.ts`）统一 `import './scripts/load-env'`，按 `.env.local` → `.env` 顺序加载；Vercel 上环境变量已注入，dotenv 不会覆盖已有值。

### 6.5 数据库迁移与初始化（部署前执行一次）

```bash
# 1. 拉取 Vercel 环境变量（首次需 vercel link）
vercel env pull .env.local

# 2. 生成并应用迁移（使用非池化连接）
pnpm db:generate
pnpm db:migrate

# 3. 创建管理员与示例内容（幂等，可重复执行）
pnpm db:seed
```

迁移与 seed 只针对当前连接串指向的数据库。切换 Preview/Production 时，确认 `DATABASE_URL_UNPOOLED` 指向正确的 Neon 分支。

### 6.6 Vercel 上的行为约束

| 约束 | 数值 / 表现 | 对设计的影响 |
| --- | --- | --- |
| 请求体上限 | 4.5MB | 图片必须浏览器直传 Blob；函数只处理 JSON 与令牌 |
| 静态文件与函数 | 同域、同次部署 | 不需要 CORS、不需要网关 |
| 文件系统 | 只读、临时 | 禁止写 `uploads/`、禁止 SQLite |
| 实例复用 | Fluid compute，实例可能复用也可能冷启动 | 不在内存里存放限流计数、登录态、缓存 |
| 函数并发 | 同一实例可并发处理多个请求 | 数据库连接数要小（`max: 3`） |
| Cron（Hobby） | 每天一次 | 定时发布改为读取时判断，不依赖 Cron |
| 构建缓存 | 依赖未变时较快 | `postbuild` 每次都会执行，注意查询次数（一次批量取 slug） |

### 6.7 部署完成后的验证

| 检查项 | 期望 |
| --- | --- |
| `GET /` | 返回 200，HTML 含深色背景与 `<div id="root">` |
| `GET /api/health` | `{ "status": "ok" }`，数据库连通 |
| `GET /blog/<slug>` | 返回注入后的静态 HTML，查看源代码可见标题与 OG |
| 后台登录 | Set-Cookie 含 `HttpOnly`、`Secure`、`SameSite=Lax` |
| 上传 3MB 图片 | 浏览器直传成功，`media` 表新增记录 |
| Preview 部署 | 使用独立数据库分支，不写入生产 |
| 未登录访问 `/api/admin/*` | 401 |

---

## 7. 关键技术点

### 7.1 星空背景性能

难点：全屏粒子动画容易掉帧，且不能影响首屏。

1. 单 `<canvas>` + 三层星星数据，坐标与透明度预计算，不放入 React state。
2. `dpr = Math.min(devicePixelRatio, 2)`，用 `ctx.setTransform` 适配高清屏。
3. 容器 `position: fixed; inset: 0; pointer-events: none; z-index: 0`，动画只重绘、不回流。
4. `document.visibilitychange` 隐藏时暂停 `requestAnimationFrame`；路由进入后台时暂停或卸载。
5. 移动端星数 ×0.6；持续 FPS < 40 时自动降级为静态。
6. `prefers-reduced-motion: reduce` 时只绘制一帧。
7. `ResizeObserver` + 防抖重建坐标，窗口拖拽不逐帧重建。

### 7.2 Markdown 安全与一致性

渲染链：`remark-gfm` → `rehype-sanitize`（自定义白名单）→ `@shikijs/rehype`。

- 存储 Markdown 原文，不存 HTML。
- 禁止 `script`、`iframe`、`on*` 事件属性、`javascript:` 协议；链接只允许 `http/https/mailto`。
- 外链统一 `rel="noopener noreferrer" target="_blank"`。
- 图片 `loading="lazy"`、`decoding="async"`，带宽高防 CLS。
- 后台预览、前台详情、postbuild 共用同一个渲染函数，避免三套逻辑。

### 7.3 鉴权与会话

- 登录成功生成 32 字节随机 token（`base64url`），数据库只存 `sha256(token)`。
- Cookie：`HttpOnly; Secure（生产）; SameSite=Lax; Path=/`；普通 7 天，「记住我」30 天。
- 会话校验：`tokenHash` 查 `sessions`，`expiresAt > now()`，联查 `users`；过期会话可惰性删除。
- 写操作中间件校验 `Origin` 与当前请求的 Host 同源（`new URL(request.url).origin`），配合 `SameSite=Lax` 防 CSRF；该方式对生产域名、预览域名与自定义域名都成立。
- 登录限流：`login_attempts` 记录失败；同一邮箱或 IP 15 分钟内 ≥ 5 次 → 429；成功登录清除计数。
- 密码：argon2id（`t=2, m=19456, p=1, dkLen=32`），盐 16 字节随机；编码为 `argon2id$m=...$salt$hash` 存储。
- 修改密码后删除该用户的其他会话。

### 7.4 编辑器自动保存与并发

- 防抖 3 秒保存；`Ctrl/Cmd + S` 立即保存。
- 保存请求携带 `updatedAt`，服务端比对：不一致返回 `409 STALE_CONTENT`，前端提示冲突，不静默覆盖。
- `localStorage` 仅缓存「未提交的本次编辑内容」，登录态不落本地。
- 字数与阅读时长前端实时显示，服务端保存时重新计算。
- 离开页面（路由变化 / `beforeunload`）时若有未保存改动则拦截。

### 7.5 图片上传（Vercel Blob 直传）

难点：Vercel 函数请求体上限 4.5MB，且无本地磁盘。

流程：
1. 浏览器选择图片 → Canvas 压缩为 WebP（最长边 1600px，质量 0.82；头像 512px）。
2. `upload(file.name, file, { access: 'public', handleUploadUrl: '/api/admin/media/upload' })` 直传 Blob。
3. 服务端 `/api/admin/media/upload` 先用会话中间件鉴权，再调用 `handleUpload` 的 `onBeforeGenerateToken` 限制类型与大小（≤ 5MB）。
4. 上传成功后，前端把 `url`、`pathname`、`size`、宽高、alt 提交到 `POST /api/admin/media` 入库。
5. 删除媒体时：检查 `posts.coverUrl`、`projects.coverUrl`、`projectImages.url` 是否引用；无引用才 `del(url)` 并删记录。

不依赖 Blob 的 `onUploadCompleted` 回调入库（本地开发无法被 Vercel 回调），统一由客户端上传成功后调用 `POST /api/admin/media` 确认，保证本地与线上行为一致。

不在函数里使用 `sharp`：原生依赖会显著增加冷启动与打包风险。压缩在浏览器完成，已足够。

### 7.6 Slug 与唯一性

- 英文保留，中文用 `pinyin-pro` 转写（或退回时间戳），统一小写、空格转 `-`、合并连续 `-`。
- 冲突时追加 `-2`、`-3`；手改时防抖 400ms 校验并给建议值。
- slug 只允许 `[a-z0-9-]`，服务端再次校验，不信任前端。

### 7.7 静态预渲染与 sitemap

`scripts/postbuild.ts` 流程：

1. 读取 `dist/index.html`，其中包含占位 `<!--app-head-->`。
2. 用 `db` 一次性查询已发布的 `posts.slug/title/summary/coverUrl/publishedAt/updatedAt` 与 `projects.slug/...`。
3. 对每个 slug：替换 head 占位为 `title`、`description`、`canonical`、OG、JSON-LD，写入 `dist/blog/<slug>/index.html` 或 `dist/projects/<slug>/index.html`。
4. 生成 `sitemap.xml`（首页、关于、项目列表、博客列表、全部详情页、标签页）与 `rss.xml`。
5. 任何异常：打印警告，`process.exitCode = 0`，保证部署不失败。

补充：`scripts/postbuild.ts` 与 `db/seed.ts` 直接读取 `DATABASE_URL` / `DATABASE_URL_UNPOOLED`，**不经过 `server/env.ts`**，避免构建或初始化阶段被 Blob、`PUBLIC_SITE_URL` 等运行时变量阻断。

可选：发布文章后由服务端调用 `DEPLOY_HOOK_URL` 触发一次重建，让 sitemap 与静态头信息立即更新。

### 7.8 搜索

- MVP：`ILIKE` 匹配标题与摘要，限制返回条数；数据量 < 500 篇足够。
- 进阶：`tsvector` 生成列 + GIN 索引；中文可配 `pg_trgm` 或 `pg_jieba`。
- 不在前端下载全量正文做搜索。

### 7.9 缓存与冷启动

| 措施 | 说明 |
| --- | --- |
| 公开接口缓存 | `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`，由 Vercel CDN 缓存 GET 响应 |
| 后台接口 | `Cache-Control: no-store` |
| 前端请求 | TanStack Query `staleTime: 60s`，避免重复请求 |
| 函数依赖 | 不引入 Prisma、sharp、Puppeteer 等重依赖；Hono + Drizzle + postgres.js + Zod 控制在可接受体积 |
| 连接 | `postgres.js` 单实例小连接池；Neon pooler 收敛连接 |
| 区域 | 将函数区域与 Neon 区域放在同一地域（如新加坡 `sin1`），降低 RTT |
| 数据库休眠 | Neon 免费计划会休眠，首个请求会有额外延迟；前端必须有骨架屏与重试 |

### 7.10 错误处理与可观测性

- 前端：`lib/api.ts` 统一封装，抛出 `ApiError`（含 `status`、`code`）；401 时清理本地用户态并跳转登录。
- 后端：`onError` 映射 Zod / 唯一约束 / 自定义领域错误；响应中不返回堆栈。
- 日志：Hono `logger` 输出方法、路径、状态、耗时；Vercel Runtime Logs 查看；不打印密码、Token、Cookie。
- 健康检查：`/api/health` 执行 `SELECT 1`。

### 7.11 安全头与 Cookie

- `secureHeaders()` + `vercel.json` 统一设置 `nosniff`、`X-Frame-Options`、`Referrer-Policy`、`Permissions-Policy`。
- 可选 CSP：`default-src 'self'; img-src 'self' data: https://*.public.blob.vercel-storage.com; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'`。上线前用报告模式验证，避免误伤。
- Cookie 在生产必须 `Secure`；本地 `vercel dev` 为 HTTP，按 `VERCEL_ENV` 条件设置。

---

## 8. 测试策略

| 层级 | 工具 | 覆盖重点 |
| --- | --- | --- |
| 单元 | Vitest（node） | slug、阅读时长、分页、可见性条件、密码哈希、Markdown 净化 |
| 组件 | Vitest + RTL（jsdom） | 卡片、列表筛选、表单校验、三态组件、星空降级 |
| API 集成 | Vitest + `app.request()` | 鉴权、CRUD、唯一冲突、草稿不可见、上传令牌鉴权、限流 |
| E2E | Playwright | 登录→写文章→发布→前台可见；改资料→首页生效；未登录重定向；移动端视口 |
| 无障碍 | axe-core（Playwright） | 关键页面无严重违规 |

说明：
- Hono 的 `app.request('/api/public/posts')` 在内存中执行，无需启动端口，适合 Serverless 项目。
- API 测试使用独立的 `DATABASE_URL_TEST`（Neon 测试分支或本地 Postgres），每次测试前 `TRUNCATE` 相关表。
- Blob 相关测试：单元测试覆盖令牌鉴权与类型校验；E2E 可使用专用测试 Store，或跳过真实上传、只验证压缩与请求参数。

质量门禁：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

覆盖率：`shared/`、`server/lib/` ≥ 80%；发布文章与鉴权必须有集成测试。

---

## 9. 风险与应对

| 风险 | 应对 |
| --- | --- |
| 静态壳不含正文 | 注入 meta/OG/JSON-LD 与 `<noscript>` 摘要；后续可升级完整 SSG |
| 构建期连不上数据库 | postbuild 失败降级，部署继续；构建日志告警 |
| Preview 写入生产数据 | Neon 分支 + 独立 Blob；Preview 环境可用只读账号或禁用写入 |
| Neon 休眠导致首个请求慢 | 前端骨架屏、超时重试；重要页面静态化；可升级付费计划 |
| Serverless 冷启动 | 精简依赖、同区域部署、CDN 缓存公开接口 |
| 4.5MB 请求体 | 图片浏览器压缩后直传 Blob |
| 图片孤儿文件 | 删除前检查引用；定期对照 `media` 表清理 Blob |
| 单管理员密码泄露 | 强密码 + 数据库限流 + HttpOnly Cookie + 可选 TOTP |
| 迁移误操作 | 只在本地/CI 执行；生产使用 `DATABASE_URL_UNPOOLED`；迁移前备份 |
| 免费额度耗尽 | 监控用量；图片压缩；静态资源长缓存 |

---

## 10. 开发顺序建议

1. 初始化 Vite + React + TS + Tailwind，配置路径别名与设计令牌。
2. 前台布局 + 星空背景（先验证性能与降级）。
3. Neon 数据库 + Drizzle schema + 迁移 + seed。
4. Hono API + 公开接口 + `/api/health`。
5. 前台页面接入真实数据。
6. 会话鉴权 + 后台框架（登录、布局、守卫）。
7. 文章编辑器（保存、预览、自动保存、发布）。
8. 个人信息、技能、项目、媒体（Blob 直传）、设置。
9. postbuild 预渲染、sitemap、RSS、缓存头。
10. Playwright、性能与无障碍检查，接入 Vercel Preview。
