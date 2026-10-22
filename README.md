# 星屿 Astra · 个人主页

深色星空主题的个人展示网站：个人介绍、技能、项目作品集、博客，以及单人使用的后台 CMS。前端与 API 部署在同一个 Vercel 项目，同域名、无 CORS。

- 前端：React 19 + TypeScript 5 + Vite 7 + React Router 7 + TanStack Query + Tailwind CSS 4
- 后端：Hono 4，入口 `api/index.ts`（Vercel Node.js Function）
- 数据：Neon Postgres 16 + Drizzle ORM + `postgres.js`
- 媒体：Vercel Blob（浏览器压缩后直传，函数只签发令牌）
- 文档：[PRD.md](./PRD.md)（需求）、[TECH_DESIGN.md](./TECH_DESIGN.md)（方案）、[AGENTS.md](./AGENTS.md)（开发规范）

## 本地开发

要求 Node.js 22 LTS 与 pnpm 10。

```bash
pnpm install

# 1. 准备环境变量（二选一）
#    a) 已创建 Vercel 项目：vercel link && vercel env pull .env.local
#    b) 手动：复制 .env.example 为 .env.local 并填写 DATABASE_URL 等
cp .env.example .env.local

# 2. 初始化数据库（首次或拉取新迁移后）
pnpm db:migrate
pnpm db:seed

# 3. 启动（前端 + /api，一次启动）
pnpm dev
```

只想单独调试时：`pnpm dev:web`（Vite 5173）与 `pnpm dev:api`（Hono 3001），Vite 已把 `/api` 代理到 3001。

`.env.local` 会由 `scripts/load-env.ts` 在 `dev:api`、`db:*`、`postbuild` 中优先读取；`vercel dev` 会自行加载。进程里已存在的环境变量不会被覆盖。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | `vercel dev`，同时运行前端与 API |
| `pnpm dev:web` / `pnpm dev:api` | 单独运行前端 / API |
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript 检查 |
| `pnpm test` | Vitest 单元与集成测试 |
| `pnpm test:e2e` | Playwright（需先安装浏览器） |
| `pnpm build` | `vite build` + 静态壳 / sitemap / RSS 生成 |
| `pnpm db:generate` | 修改 `db/schema.ts` 后生成迁移 |
| `pnpm db:migrate` | 应用迁移（使用 `DATABASE_URL_UNPOOLED`） |
| `pnpm db:seed` | 幂等创建管理员与初始数据 |
| `pnpm db:studio` | Drizzle Studio |

提交前至少执行 `pnpm lint && pnpm typecheck && pnpm test`。

## 部署到 Vercel

### 1. 创建资源

1. 在 Vercel 新建项目并导入本仓库。框架预设选 **Vite**，根目录保持不变。
2. 在项目的 **Storage / Marketplace** 中创建 **Neon**（Postgres）与 **Blob**，环境勾选 Development、Preview、Production。Vercel 会自动注入：
   - `DATABASE_URL`（pooled）与 `DATABASE_URL_UNPOOLED`（direct）
   - `BLOB_READ_WRITE_TOKEN`（或 `BLOB_STORE_ID` + `VERCEL_OIDC_TOKEN`）
3. 手动补充项目环境变量（Production / Preview 分别配置）：
   - `PUBLIC_SITE_URL`：正式域名，如 `https://example.com`；留空时回退到 `https://$VERCEL_PROJECT_PRODUCTION_URL`
   - `ADMIN_EMAIL`、`ADMIN_PASSWORD`：仅本地执行 seed 时需要，不必加到 Vercel
   - `DEPLOY_HOOK_URL`：可选，发布内容后触发静态页重建

> Preview 建议使用独立的 Neon 分支与 Blob Store，避免预览站写入生产数据。

### 2. 初始化数据库（部署前执行一次）

迁移与 seed 在本地或 CI 执行，**不要**放进 Vercel 构建命令。

```bash
vercel link
vercel env pull .env.local

# 确认 .env.local 指向目标数据库（生产库请使用 Production 的环境变量）
pnpm db:migrate
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='至少8位强密码' pnpm db:seed
```

PowerShell 写法：

```powershell
$env:ADMIN_EMAIL='you@example.com'; $env:ADMIN_PASSWORD='至少8位强密码'; pnpm db:seed
```

seed 幂等：管理员已存在时跳过创建，不会覆盖密码。

### 3. 部署与验证

推送到主分支后 Vercel 自动安装、构建并发布；PR 会生成 Preview。构建时 `scripts/postbuild.ts` 会连接数据库生成详情页静态壳、`sitemap.xml`、`rss.xml`；数据库缺失或查询失败时按空内容继续生成静态壳，`robots.txt` 与只含固定路由的 `sitemap.xml` 仍会产出，不阻断部署。

上线后依次检查：

1. `GET /api/health` 返回 `{ "status": "ok", "db": "ok" }`
2. `/admin/login` 能登录，Cookie 含 `HttpOnly`、`SameSite=Lax`，生产环境含 `Secure`
3. 新建一篇含代码块与图片的文章 → 发布 → 前台列表与详情正常
4. 直接打开 `/blog/<slug>` 与 `/projects/<slug>`（硬刷新）不 404
5. 上传一张 3MB 图片，确认走 Blob 直传
6. 未登录访问 `/api/admin/*` 返回 401

### 路由回退

`vercel.json` 用 `/:path((?!api/).*)` → `/index.html` 处理 SPA 深链接，排除 `/api`。静态文件（含 `postbuild` 生成的 `/blog/<slug>/index.html`）优先于回退规则。

## 目录速查

```
api/index.ts           唯一 Vercel Function 入口（多级路径由 vercel.json 重写进来）
server/                Hono 应用、路由、服务、中间件、工具
db/                    Drizzle schema、迁移、seed
shared/                前后端共享的 Zod schema 与 DTO
src/                   前端：app / components / features / lib / styles
scripts/postbuild.ts   静态壳、sitemap、RSS、robots（失败自动降级）
scripts/load-env.ts    本地脚本的 .env.local 加载
```

详细分层与规范见 [AGENTS.md](./AGENTS.md)。

## 安全与运维

- 会话只走 HttpOnly Cookie，密码使用 argon2id 哈希，登录失败写数据库限流。
- Markdown 渲染经过 `rehype-sanitize`，禁用原始 HTML 与危险协议。
- 上传只接受图片类型与大小上限，令牌签发前再次校验会话。
- 文章/项目删除为软删除；多表写入使用事务。
- 备份依赖 Neon 时间点恢复；建议定期导出内容与检查 Blob 用量。
