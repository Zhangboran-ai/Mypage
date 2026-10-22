import { Hono } from 'hono'
import { tagInputSchema } from '../../shared/index.js'
import type { AppEnv } from '../types.js'
import { ok, okWithStatus } from '../lib/http.js'
import { parseJson } from '../lib/validate.js'
import {
  createTag,
  deleteTag,
  listAllTags,
  listTagsWithCounts,
  updateTag,
} from '../services/tag-service.js'

export const adminTagRoutes = new Hono<AppEnv>()

adminTagRoutes.get('/tags', async (c) => {
  return ok(c, await listTagsWithCounts())
})

adminTagRoutes.get('/tags/all', async (c) => {
  return ok(c, await listAllTags())
})

adminTagRoutes.post('/tags', async (c) => {
  const input = await parseJson(c, tagInputSchema)
  return okWithStatus(c, await createTag(input.name, input.slug), 201)
})

adminTagRoutes.put('/tags/:id', async (c) => {
  const input = await parseJson(c, tagInputSchema)
  return ok(c, await updateTag(c.req.param('id'), input.name, input.slug))
})

adminTagRoutes.delete('/tags/:id', async (c) => {
  await deleteTag(c.req.param('id'))
  return ok(c, { ok: true })
})
