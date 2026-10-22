import { Hono } from 'hono'
import { postInputSchema, postListQuerySchema, postStatusActionSchema } from '../../shared/index.js'
import type { AppEnv } from '../types.js'
import { ok, okWithStatus } from '../lib/http.js'
import { parseJson, parseQuery } from '../lib/validate.js'
import { triggerDeployHook } from '../lib/deploy-hook.js'
import {
  createPost,
  deletePost,
  getAdminPost,
  listAdminPosts,
  publishPost,
  unpublishPost,
  updatePost,
} from '../services/post-service.js'

export const adminPostRoutes = new Hono<AppEnv>()

adminPostRoutes.get('/posts', async (c) => {
  const query = parseQuery(c, postListQuerySchema)
  return ok(c, await listAdminPosts(query))
})

adminPostRoutes.post('/posts', async (c) => {
  const user = c.get('user')
  const input = await parseJson(c, postInputSchema)
  const created = await createPost(user.id, input)
  if (input.status !== 'DRAFT') await triggerDeployHook()
  return okWithStatus(c, created, 201)
})

adminPostRoutes.get('/posts/:id', async (c) => {
  return ok(c, await getAdminPost(c.req.param('id')))
})

adminPostRoutes.put('/posts/:id', async (c) => {
  const input = await parseJson(c, postInputSchema)
  const updated = await updatePost(c.req.param('id'), input)
  if (input.status !== 'DRAFT') await triggerDeployHook()
  return ok(c, updated)
})

adminPostRoutes.delete('/posts/:id', async (c) => {
  await deletePost(c.req.param('id'))
  return ok(c, { ok: true })
})

adminPostRoutes.post('/posts/:id/publish', async (c) => {
  const input = await parseJson(c, postStatusActionSchema)
  await publishPost(c.req.param('id'), input.publishedAt)
  await triggerDeployHook()
  return ok(c, { ok: true })
})

adminPostRoutes.post('/posts/:id/unpublish', async (c) => {
  await unpublishPost(c.req.param('id'))
  await triggerDeployHook()
  return ok(c, { ok: true })
})
