# AGENTS.md — AI 开发规范

本文件面向在本仓库工作的 AI 编码助手。开始任何任务前必须先阅读本文件、`PRD.md` 与 `TECH_DESIGN.md`。若三者冲突，按以下优先级执行：**PRD（要做什么） > TECH_DESIGN（怎么做） > 本文件（怎么写）**；仍不明确时向用户确认，不要自行发挥。

---

## 1. 项目概述

- **是什么**：一个部署在 Vercel 上的个人展示网站，包含个人介绍、技能展示、项目作品集、博客，以及单人使用的后台管理系统（CMS）。
- **技术栈**：单包 pnpm 项目（不使用 workspace）。前端 React 19 + TypeScript 5 + Vite 7 + React Router 7 + TanStack Query + Tailwind CSS 4；后端 Hono 4 运行在 Vercel Node.js Function（`api/[...route].ts`）；数据库 Neon Postgres 16 + Drizzle ORM + `postgres.js`；图片存 Vercel Blob。
- **部署形态**：一个 Vercel 项目同时承载静态前端与 `/api/*` 函数，同域名、无 CORS。数据库与 Blob 通过 Vercel Marketplace 创建并注入环境变量。
- **目标用户**：访客（看简介/作品/文章）与唯一管理员（在后台维护内容）。
- **视觉基调**：深色主题 + 可降级的星空背景，简洁现代，全端适配。后台关闭星空动画，强调信息密度与效率。
- **不做的事**：多用户注册、评论社区、支付、多语言切换、原生 App、富文本编辑器（文章一律用 Markdown）、独立常驻后端服务、本地文件存储、SQLite。

### 1.1 命令

```bash
pnpm install                 # 安装依赖
pnpm dev                     # vercel dev：同时启动前端与 /api（首次需 vercel link）
pnpm dev:web                 # 仅 Vite 前端（5173）
pnpm dev:api                 # 仅 Hono API（3001，@hono/node-server）
pnpm lint                    # ESLint
pnpm typecheck               # tsc --noEmit
pnpm test                    # Vitest：单元 + 组件 + API
pnpm test:e2e                # Playwright
pnpm build                   # vite build + scripts/postbuild.ts
pnpm db:generate             # drizzle-kit 生成迁移
pnpm db:migrate              # 应用迁移（使用 DATABASE_URL_UNPOOLED）
pnpm db:seed                 # 初始化管理员与示例数据（幂等）
pnpm db:studio               # Drizzle Studio
vercel env pull .env.local   # 拉取 Vercel 环境变量
```

提交前至少运行：`pnpm lint && pnpm typecheck && pnpm test`。改动涉及页面/表单/鉴权时再运行相关 E2E。

### 1.2 关键目录速查

| 路径 | 职责 |
| --- | --- |
| `api/[...route].ts` | **唯一** Vercel Function 入口，只做转发，不写业务 |
| `server/app.ts` | Hono 实例、`basePath('/api')`、中间件与路由挂载 |
| `server/routes/` | HTTP 层：校验入参、调用 service、组装响应 |
| `server/services/` | 业务规则与数据库读写，不接触 Request/Response |
| `server/middleware/` | 鉴权、Origin 校验、限流、错误处理 |
| `server/lib/` | 数据库、会话、密码、slug、分页、Blob 工具 |
| `db/schema.ts` | 数据模型唯一事实来源 |
| `shared/` | 前后端共享 Zod schema、DTO、常量（禁止依赖框架） |
| `scripts/postbuild.ts` | 静态壳预渲染、sitemap、RSS（失败自动降级） |
| `src/app/router.tsx` | 路由表、懒加载、守卫、`errorElement` |
| `src/components/background/` | 星空 Canvas，禁止调用 API |
| `src/components/ui/` | 无业务原子组件 |
| `src/features/*` | 按业务域组织的前台页面 |
| `src/features/admin/*` | 后台模块（自带 api hook、表单、列表） |
| `src/lib/markdown.tsx` | **全站唯一** Markdown 渲染器（预览与线上共用） |
| `src/lib/api.ts` | 唯一 HTTP 出口，统一错误与凭据 |
| `src/lib/image.ts` | 上传前 Canvas 压缩（WebP） |
| `src/styles/tokens.css` | 设计令牌来源，颜色/间距/圆角不得散落硬编码 |

---

## 2. 开发规范

### 2.1 工作流程

1. **先读后写**：动手前阅读相关 feature、共享 schema 与设计令牌；不要重复实现已有工具函数。
2. **先小后大**：单次改动聚焦一个目标；跨模块重构先说明理由与影响面。
3. **数据先行**：涉及新字段/新实体时，顺序为 `db/schema.ts` → `db:generate`/`db:migrate` → `shared/` schema → service → route → 前端，禁止前端先写死 Mock 后补接口。
4. **复用优先**：新增组件前先搜索 `components/ui` 与同名 feature；能扩展就不新建。
5. **不留半成品**：不提交 `TODO` 占位实现、注释掉的旧代码、`console.log`、调试用的假数据。
6. **文档同步**：新增页面、接口、环境变量或改变数据结构时，同步更新 `TECH_DESIGN.md` 与 `README.md`。
7. **不要擅自升级**：不新增重量级依赖、不升级主版本、不修改构建工具链，除非用户明确要求；新增依赖需说明体积与对冷启动的影响。

### 2.2 分层职责

| 层 | 可以做 | 不可以做 |
| --- | --- | --- |
| 路由/页面 | 组合区块、调用 query hook、设置 SEO | 写 SQL、拼接请求 URL、内联大段业务逻辑 |
| feature 组件 | 展示、交互、局部表单状态 | 直接 `fetch`、硬编码颜色值、读写 `localStorage` 存业务数据 |
| `src/lib/api.ts` | HTTP 封装、错误映射 | 包含具体业务字段逻辑 |
| `server/routes` | 参数校验、鉴权、调用 service、组装响应 | 复杂查询、业务规则、直接操作 `db` |
| `server/services` | 业务规则、Drizzle 查询、事务 | 读取 `request`/`reply`、判断 Cookie |
| `shared/` | Zod schema、DTO 类型、常量 | 依赖 React / Hono / Drizzle / Node API |
| `api/[...route].ts` | 导出 `fetch` 处理器 | 写任何路由或业务代码 |

### 2.3 前端规范

- **TypeScript**：`strict: true`；禁止 `any`（必要时 `unknown` + 收窄）；禁止用非空断言 `!` 偷懒；导出组件必须有显式 props 类型。
- **组件**：函数组件 + 具名导出；单文件 ≤ 200 行；一个文件只导出一个主组件（可附带工具函数）。
- **命名**：组件/类型 `PascalCase`，函数/变量 `camelCase`，常量 `UPPER_SNAKE_CASE`；文件：组件 `PascalCase.tsx`，hook `useXxx.ts`，工具 `kebab-case.ts`。
- **数据获取**：只用 TanStack Query；query key 从 `lib/query.ts` 工厂取；变更后精确失效，禁止 `invalidateQueries()` 全量清空。
- **状态管理**：服务端数据不进 Zustand；仅放 UI 状态（侧边栏、编辑器未保存标记）。
- **路由**：页面级组件默认懒加载；后台模块整体懒加载；每个路由配置 `errorElement`。
- **表单**：React Hook Form + `zodResolver`，schema 来自 `shared/`；错误就近展示；提交按钮有 loading 与禁用态。
- **样式**：Tailwind 原子类 + `tokens.css` 变量；禁止魔法色值、`!important`、内联 `style`（动态计算值除外）；移动优先。
- **动效**：只动 `transform`/`opacity`；必须尊重 `useReducedMotion()`；列表项不做长时间循环动画。
- **图片**：必须提供 `alt`、`width`、`height`、`loading="lazy"`（首屏主图除外）；上传前先压缩。
- **错误与空态**：每个数据区块实现 loading（骨架）、empty、error（可重试）三态。
- **日期**：统一通过 `lib/format.ts` 输出 `Asia/Shanghai`，不在组件里直接拼 `toLocaleString()`。
- **文案**：界面文案用简体中文；个人内容必须来自接口数据，不硬编码。

### 2.4 后端规范

- **运行环境**：Vercel Node.js Runtime；Hono 基于 Web 标准 `Request`/`Response`；不使用只在长驻进程里成立的写法。
- **路由**：公开 `/api/public`，鉴权 `/api/auth`，管理 `/api/admin`；全部挂载在 `server/app.ts` 的 `basePath('/api')` 下。
- **路径别名**：`api/` 与 `server/` **禁止使用 tsconfig paths / `@/`**（Vercel 函数构建不支持），只能相对路径；`shared/` 用相对路径引入。
- **校验**：所有输入（body/query/params）用 `shared/` 的 Zod schema 校验；未校验的输入不得进入 service。
- **响应**：严格按 `TECH_DESIGN.md` 的 `{ data }` / `{ error: { code, message } }` / 分页 `meta`，不临时改变形状。
- **鉴权**：`/api/admin/*` 统一挂鉴权中间件并在 `onBeforeGenerateToken` 等回调里再次确认；禁止单个 handler 自行解析 Cookie。
- **查询**：列表必须分页且有上限；只 select 必要字段；禁止循环查库（N+1）；禁止无界 `findMany`（Drizzle 无此 API，等价于不加 `limit`）。
- **事务**：文章 + 标签、项目 + 技术栈等多表写入必须使用 `db.transaction()`。
- **软删除**：文章/项目删除只写 `deletedAt`；所有查询默认过滤。
- **可见性**：公开查询必须同时满足 `deletedAt IS NULL` 与 `PUBLISHED` 或「`SCHEDULED` 且 `publishedAt <= now()`」。
- **时间**：数据库 `timestamptz` 存 UTC；定时发布由数据库 `now()` 判断，不接受客户端时间。
- **错误**：抛出带 `code` 的领域错误，由 `onError` 映射 HTTP 状态；不把 Drizzle/Postgres 原始错误返回给客户端。
- **日志**：使用 Hono `logger` 或 `console` JSON；禁止记录密码、Token、Cookie、完整请求体。
- **上传**：不接收文件流写入磁盘；只签发 Blob 上传令牌与保存元数据；校验类型、大小与引用关系。

### 2.5 Vercel / Serverless 专属红线

- 不写本地文件（`fs.writeFile`、`uploads/`、临时目录持久化）；函数文件系统只读且临时。
- 不使用依赖常驻内存的逻辑：内存限流、`setInterval` 定时任务、进程内缓存作为唯一数据源。
- 不把业务代码放进 `api/`；该目录每个文件都会变成一个独立函数。
- 不引入原生二进制依赖（`sharp`、`canvas`、`puppeteer`、Prisma 引擎）；会显著增加冷启动与打包风险。
- 不假设请求体可以超过 4.5MB；大文件必须浏览器直传 Blob。
- 不在 Vercel 构建命令里执行数据库迁移或 seed；迁移在本地/CI 执行一次。
- 不把 `VITE_` 前缀变量用于密钥；所有 `VITE_` 变量都会进入客户端产物。
- 不在 Preview 环境写入生产数据库；预览必须使用独立 Neon 分支/连接串。
- 不在函数中依赖客户端 IP 的绝对准确性；限流只作为防护，不作为鉴权。

### 2.6 安全红线（任何情况下都不得违反）

- 不把密钥、`.env`、数据库连接串写入代码或提交到仓库。
- 不在前端使用 `dangerouslySetInnerHTML` 渲染 Markdown；必须走净化后的渲染器。
- 不关闭 `rehype-sanitize`、不放开 `script`/`iframe`/`on*` 属性白名单。
- 不使用 `localStorage` 存会话 token；会话只走 HttpOnly Cookie。
- 不拼接 SQL 字符串；只用 Drizzle 参数化查询。
- 不在生产环境开放注册接口或默认管理员密码。
- 不在客户端直接调用 Blob 写入接口而不经过服务端令牌鉴权。
- 不把 Blob 存储设为私有后又在前台直接引用（博客图片必须公开可读）。

---

## 3. 测试要求

### 3.1 分层要求

| 改动类型 | 必须补充的测试 |
| --- | --- |
| 工具函数 / 纯逻辑（slug、阅读时长、分页、格式化、可见性条件） | Vitest 单元测试，覆盖正常、边界、异常输入 |
| 共享 Zod schema | 单元测试：合法数据通过、非法数据给出预期字段错误 |
| UI 组件（卡片、表单、列表、状态组件） | RTL 组件测试：渲染内容、用户交互、loading/empty/error 三态 |
| API 路由 | `app.request()` 集成测试：成功、参数错误、未登录 401、不存在 404、冲突 409 |
| 鉴权 / 权限 | 未登录访问管理接口被拒；登录后会话有效；退出后失效；Origin 不符被拒 |
| 内容可见性 | 草稿不出现在公开列表与详情；定时未到不公开；到时自动可见 |
| 上传 | 非法类型、超限大小被拒绝；未登录无法获取上传令牌 |
| 关键用户流程 | Playwright E2E（见下） |

### 3.2 必测 E2E 场景

1. 登录 → 新建文章（含代码块与图片）→ 发布 → 前台列表可见 → 详情渲染正确。
2. 未登录访问 `/admin/posts` → 重定向登录页；登录后回到原页面。
3. 修改个人信息 → 保存 → 刷新首页显示新内容。
4. 新建项目并设为精选 → 首页展示 → 取消发布 → 首页消失。
5. 移动端视口（375×812）：导航可用、文章可读、无横向滚动。

### 3.3 测试写法约定

- 测试文件与被测文件同目录，命名 `*.test.ts(x)`；E2E 放 `e2e/`。
- 测试名用中文描述行为："未登录时返回 401"，不使用 `test1` 之类命名。
- API 测试直接用 `app.request('/api/...')`，不要启动端口；数据库使用 `DATABASE_URL_TEST`，每次测试前清理相关表。
- 每个测试独立准备数据，禁止依赖执行顺序。
- 禁止 `test.skip` / `test.only` 留在主分支；临时跳过必须写原因并说明恢复计划。
- 断言行为与可访问角色（`getByRole`、`getByLabelText`），少用 `data-testid`；禁止断言具体 class 名。
- 覆盖率要求：`shared/`、`server/lib/` ≥ 80%；核心业务流程必须有集成测试，不以覆盖率替代。

### 3.4 完成定义（Definition of Done）

一个任务只有同时满足以下条件才算完成：

- [ ] 功能符合 `PRD.md` 对应条目与验收标准。
- [ ] `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build` 全部通过。
- [ ] 新增/修改逻辑有对应测试，关键流程有 E2E。
- [ ] 三种状态（loading / empty / error）已实现。
- [ ] 移动端与桌面端均验证过（375px、768px、1280px）。
- [ ] 键盘可操作，焦点可见，图片有 alt。
- [ ] 无新增 `any`、无 `console.log`、无硬编码颜色/文案（个人内容除外）。
- [ ] 不写本地磁盘、不使用内存限流、不新增原生依赖。
- [ ] 文档、`.env.example`、共享类型已同步。
- [ ] 涉及页面/接口的改动已在 `vercel dev` 下验证；必要时检查 Preview 部署。

---

## 4. 代码风格

### 4.1 格式与静态检查

- Prettier：单引号、无分号、行宽 100、尾随逗号 `all`、2 空格缩进。
- ESLint：`@typescript-eslint` 推荐规则 + `react-hooks` + `jsx-a11y`；禁止未使用变量、浮动 Promise、`any`、`dangerouslySetInnerHTML`（白名单文件除外）。
- import 顺序：Node/第三方 → `@/` 或 `@shared/` → 相对路径 → 样式；组间空行。`src/` 内禁止超过两层的 `../../../`。
- 提交前由 husky + lint-staged 自动格式化暂存文件。

### 4.2 TypeScript 约定

```ts
// 好：显式返回类型 + 收窄
export function toReadingTime(content: string): number {
  return Math.max(1, Math.ceil(countWords(content) / 300))
}

// 差：隐式 any、断言掩盖问题
export function toReadingTime(content) {
  return (content as any).length / 300
}
```

- 优先 `type` 定义对象与联合，`interface` 仅用于可扩展的公共契约。
- 联合类型用字面量联合或常量，禁止魔法字符串散落（如 `'DRAFT'`）。
- 共享 DTO 一律 `z.infer<typeof schema>` 推导，不手写两份。

### 4.3 React 约定

```tsx
// 好：语义化、可访问、使用设计令牌
export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="rounded-2xl border border-white/8 bg-white/4 p-5 transition hover:-translate-y-1">
      <h3 className="text-lg font-semibold text-text-primary">{project.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-text-secondary">{project.summary}</p>
    </article>
  )
}
```

- 组件只接收它需要的字段，不传整个实体。
- 事件处理函数命名 `handleXxx`；props 回调命名 `onXxx`。
- `useEffect` 只用于同步外部系统；数据获取用 Query，派生状态用计算。
- 列表 `key` 使用稳定 ID，禁止用索引。
- 条件渲染避免深层三元，超过两层抽子组件。

### 4.4 命名与文案

- 代码标识符用英文；界面文案用简体中文。
- 布尔值以 `is/has/can/should` 开头。
- API/前端字段 `camelCase`，数据库字段 `snake_case`（由 Drizzle 显式映射）。
- 注释只解释"为什么"，不复述代码；公共函数写一句话说明用途与边界。

### 4.5 Git 约定

- Conventional Commits：`feat(blog): 支持文章定时发布`、`fix(admin): 修复草稿被公开接口返回`、`refactor(api): 抽取可见性条件`、`test(api): 补充鉴权用例`、`docs: 更新 Vercel 环境变量说明`。
- 一个提交一件事；不混入格式化无关文件的改动。
- 不提交 `dist/`、`node_modules/`、`.vercel/`、`.env*`、本地数据库文件、上传产物。

---

## 5. 注意事项（易错点清单）

### 5.1 内容与权限

1. **草稿泄露**：公开列表与按 slug 详情都必须过滤 `deletedAt` 与发布状态；只看列表会漏掉直接 URL 访问。
2. **定时文章**：状态可能是 `SCHEDULED`，可见性判断要用数据库 `now()`，不要在前端比较时间。
3. **越权**：后台接口不要只靠前端隐藏按钮；每个写接口都要服务端鉴权。
4. **单管理员**：不实现注册；seed 时若已存在管理员则跳过，不覆盖密码。
5. **软删除**：删除文章/项目只写 `deletedAt`；删除标签/分类注意关联数据。

### 5.2 渲染与安全

6. **XSS**：Markdown 原始 HTML 默认禁用；链接协议白名单只允许 `http/https/mailto`。
7. **预览一致**：后台预览必须使用 `src/lib/markdown.tsx`，禁止另写渲染逻辑；postbuild 也复用同一渲染函数。
8. **上传**：浏览器直传 Blob 前必须压缩；服务端令牌回调里必须再次鉴权；删除 Blob 前检查引用。
9. **CSRF**：写操作校验 `Origin`；不要关闭 Cookie 的 `SameSite`。
10. **Cookie**：生产 `Secure`，本地按 `VERCEL_ENV` 条件设置；不要在 JS 中读取会话 Cookie（HttpOnly）。

### 5.3 性能与体验

11. **星空**：不要在 React state 中逐帧更新；页面隐藏时暂停；`prefers-reduced-motion` 时静态化；后台不加载。
12. **包体与冷启动**：后台代码不得进入访客首屏；Shiki/编辑器/裁剪库动态导入；不引入原生二进制依赖。
13. **布局抖动**：图片、骨架屏、字体预留尺寸；hover 用 `transform`，不要改宽高。
14. **移动端**：375px 无横向滚动；长单词/长 URL 断行；固定底栏避让安全区。
15. **对比度**：毛玻璃卡片上的文字保证 4.5:1；星星不能透过文字影响阅读。

### 5.4 数据与一致性

16. **时间**：`timestamptz` 存 UTC，展示统一走 `lib/format.ts`；定时发布由服务端/数据库判断。
17. **排序**：`sortOrder` 相同时必须有次级排序，否则列表顺序不稳定。
18. **并发保存**：编辑器保存带 `updatedAt` 乐观锁，冲突返回 409，不静默覆盖。
19. **N+1**：列表接口一次取回关联（join / 批量查询），禁止循环查询。
20. **分页**：任何列表接口都必须有上限。
21. **事务**：多表写入必须 `db.transaction()`；不要分多次独立写入后假定原子性。

### 5.5 工程习惯

22. **路径别名**：`src/` 用 `@/`、`@shared/`；`server/` 与 `api/` 只能用相对路径，且必须带显式 `.js` 扩展名（目录导入写到 `index.js`），见第 29 条。
23. **`api/` 目录**：只保留 `[...route].ts`，新增文件会变成新函数。
24. **环境变量**：新增变量必须同时更新 `.env.example`、`TECH_DESIGN.md` 与 Vercel 配置说明；`server/env.ts` 用 Zod 校验，缺失即启动失败。
25. **迁移**：只在本地/CI 执行；生产用 `DATABASE_URL_UNPOOLED`；禁止在 Vercel 构建里迁移。
26. **构建降级**：`scripts/postbuild.ts` 必须捕获所有异常并以 0 退出，不能让数据库问题阻断部署。
27. **依赖方向**：`src` 不直接 import `server`；`server` 不 import `src`；共享内容只放 `shared/`。
28. **不确定就问**：涉及删除数据、修改鉴权、调整数据结构、引入新服务时，先向用户确认。
29. **ESM 扩展名**：`api/`、`server/`、`shared/`、`db/` 之间的相对导入必须带 `.js`（如 `import { db } from './lib/db.js'`、`from '../../shared/index.js'`）。Vercel 把函数逐文件转译成 ESM 后交给 Node 原生运行，Node 不会自动补扩展名，漏写会以 `ERR_MODULE_NOT_FOUND` 在函数加载阶段失败；本地 `vite` 与 `tsx` 会自动补全，测不出来。

---

## 6. 交付与沟通

- 完成改动后，向用户说明：改了什么、为什么这样改、如何验证（命令或操作路径）、有哪些遗留风险。
- 报告问题要给出可复现步骤与相关文件路径，不笼统描述"有问题"。
- 引用代码时给出 `文件:行号`；不要粘贴大段无关代码。
- 不要声称"已完成/已测试"而未实际运行校验命令。
- 部署由用户自行操作；AI 负责保证构建产物、环境变量清单与 `vercel.json` 正确，不代为登录 Vercel 或执行发布。
