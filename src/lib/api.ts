export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & { json?: unknown; body?: BodyInit }

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options

  const response = await fetch(path, {
    credentials: 'same-origin',
    ...rest,
    headers: {
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : options.body,
  })

  if (!response.ok) {
    let code = 'INTERNAL_ERROR'
    let message = `请求失败（${response.status}）`
    let details: unknown

    try {
      const payload = (await response.json()) as {
        error?: { code?: string; message?: string; details?: unknown }
      }
      code = payload.error?.code ?? code
      message = payload.error?.message ?? message
      details = payload.error?.details
    } catch {
      // 非 JSON 错误响应，保留默认文案
    }

    if (response.status === 401 && path.startsWith('/api/admin')) {
      window.dispatchEvent(new CustomEvent('astra:unauthorized'))
    }

    throw new ApiError(response.status, code, message, details)
  }

  if (response.status === 204) return undefined as T

  const payload = (await response.json()) as { data: T }
  return payload.data
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, json?: unknown) => request<T>(path, { method: 'POST', json }),
  put: <T>(path: string, json?: unknown) => request<T>(path, { method: 'PUT', json }),
  patch: <T>(path: string, json?: unknown) => request<T>(path, { method: 'PATCH', json }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue
    search.set(key, String(value))
  }

  const query = search.toString()
  return query ? `?${query}` : ''
}
