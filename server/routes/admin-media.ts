import { Hono } from 'hono'
import type { HandleUploadBody } from '@vercel/blob/client'
import { mediaConfirmSchema, mediaListQuerySchema, mediaUpdateSchema } from '../../shared'
import type { AppEnv } from '../types'
import { badRequest, unauthorized } from '../lib/errors'
import { getSessionToken } from '../lib/session'
import { ok, okWithStatus } from '../lib/http'
import { parseJson, parseQuery } from '../lib/validate'
import { handleClientUpload } from '../lib/storage'
import {
  createMedia,
  deleteMedia,
  listMedia,
  updateMediaAlt,
} from '../services/media-service'

export const adminMediaRoutes = new Hono<AppEnv>()

adminMediaRoutes.post('/media/upload', async (c) => {
  let body: unknown

  try {
    body = await c.req.json()
  } catch {
    throw badRequest('上传请求体不合法')
  }

  const sessionToken = getSessionToken(c)
  if (!sessionToken) throw unauthorized()

  const result = await handleClientUpload({
    request: c.req.raw,
    body: body as HandleUploadBody,
    sessionToken,
  })

  return c.json(result)
})

adminMediaRoutes.post('/media', async (c) => {
  const input = await parseJson(c, mediaConfirmSchema)
  return okWithStatus(c, await createMedia(input), 201)
})

adminMediaRoutes.get('/media', async (c) => {
  const query = parseQuery(c, mediaListQuerySchema)
  return ok(c, await listMedia(query))
})

adminMediaRoutes.patch('/media/:id', async (c) => {
  const input = await parseJson(c, mediaUpdateSchema)
  return ok(c, await updateMediaAlt(c.req.param('id'), input.alt ?? null))
})

adminMediaRoutes.delete('/media/:id', async (c) => {
  await deleteMedia(c.req.param('id'))
  return ok(c, { ok: true })
})
