import { Hono } from 'hono'
import { z } from 'zod'
import {
  contactMessageSchema,
  publicPostListQuerySchema,
  projectListQuerySchema,
  slugSchema,
} from '../../shared'
import type { AppEnv } from '../types'
import { getClientIp, getUserAgent, ok, okWithStatus, setPublicCache } from '../lib/http'
import { parseJson, parseQuery } from '../lib/validate'
import { getPublicPostBySlug, listPublicPosts } from '../services/post-service'
import { getPublicProjectBySlug, listPublicProjects } from '../services/project-service'
import { getPublicProfile } from '../services/profile-service'
import { getSettings } from '../services/setting-service'
import { listTagsWithCounts } from '../services/tag-service'
import { createMessage } from '../services/message-service'

const slugParamSchema = z.object({ slug: slugSchema })

export const publicRoutes = new Hono<AppEnv>()

publicRoutes.get('/profile', async (c) => {
  setPublicCache(c)
  return ok(c, await getPublicProfile())
})

publicRoutes.get('/projects', async (c) => {
  setPublicCache(c)
  const query = parseQuery(c, projectListQuerySchema)
  return ok(c, await listPublicProjects(query))
})

publicRoutes.get('/projects/:slug', async (c) => {
  setPublicCache(c, 30)
  const { slug } = slugParamSchema.parse(c.req.param())
  return ok(c, await getPublicProjectBySlug(slug))
})

publicRoutes.get('/posts', async (c) => {
  setPublicCache(c)
  const query = parseQuery(c, publicPostListQuerySchema)
  return ok(c, await listPublicPosts(query))
})

publicRoutes.get('/posts/:slug', async (c) => {
  setPublicCache(c, 30)
  const { slug } = slugParamSchema.parse(c.req.param())
  return ok(c, await getPublicPostBySlug(slug))
})

publicRoutes.get('/tags', async (c) => {
  setPublicCache(c)
  return ok(c, await listTagsWithCounts())
})

publicRoutes.get('/settings', async (c) => {
  setPublicCache(c)
  return ok(c, await getSettings())
})

publicRoutes.post('/messages', async (c) => {
  const input = await parseJson(c, contactMessageSchema)
  await createMessage(input, { ip: getClientIp(c), userAgent: getUserAgent(c) })
  return okWithStatus(c, { ok: true }, 201)
})
