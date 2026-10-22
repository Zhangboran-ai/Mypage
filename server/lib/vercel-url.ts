const REWRITE_PARAM = '__path'

/**
 * Vercel 对非 Next.js 项目的 `api/` 函数只匹配单层路径（`/api/foo`），
 * 多级路径（`/api/public/posts`）会被平台直接返回 NOT_FOUND。
 * 因此 `vercel.json` 把 `/api/(.*)` 重写为 `/api?__path=$1`，
 * 这里把原始路径还原成 Hono 期望的 `/api/...`；如果平台已保留原始路径，
 * 仅移除内部参数。两种情况都保留请求方法、请求体与其余查询参数。
 */
export function restoreOriginalUrl(request: Request): Request {
  const url = new URL(request.url)
  const rewrittenPath = url.searchParams.get(REWRITE_PARAM)

  if (rewrittenPath === null) {
    return request
  }

  url.searchParams.delete(REWRITE_PARAM)

  if (isRewriteTarget(url.pathname)) {
    url.pathname = `/api/${rewrittenPath.replace(/^\/+/, '')}`
  }

  return buildRequest(url, request)
}

/** 重写后的目标路径只有这几种写法，其余说明平台保留了原始路径。 */
function isRewriteTarget(pathname: string): boolean {
  return pathname === '/api' || pathname === '/api/' || pathname === '/api/index'
}

type StreamingRequestInit = RequestInit & { duplex: 'half' }

function buildRequest(url: URL, request: Request): Request {
  if (!request.body) {
    return new Request(url, { method: request.method, headers: request.headers })
  }

  const init: StreamingRequestInit = {
    method: request.method,
    headers: request.headers,
    body: request.body,
    duplex: 'half',
  }

  return new Request(url, init)
}
