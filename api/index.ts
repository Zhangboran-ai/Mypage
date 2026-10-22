import { app } from '../server/app.js'
import { restoreOriginalUrl } from '../server/lib/vercel-url.js'

// Vercel Node.js Runtime 的 Web 标准入口：所有 /api/* 请求进入同一个 Hono 实例
export default {
  fetch: (request: Request) => app.fetch(restoreOriginalUrl(request)),
}
