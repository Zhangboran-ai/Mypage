import { Hono } from 'hono'
import { experienceInputSchema, profileUpdateSchema, socialLinkInputSchema } from '../../shared/index.js'
import type { AppEnv } from '../types.js'
import { ok, okWithStatus } from '../lib/http.js'
import { parseJson } from '../lib/validate.js'
import {
  createExperience,
  createSocialLink,
  deleteExperience,
  deleteSocialLink,
  getAdminProfileBundle,
  updateExperience,
  updateProfile,
  updateSocialLink,
} from '../services/profile-service.js'

export const adminProfileRoutes = new Hono<AppEnv>()

adminProfileRoutes.get('/profile', async (c) => {
  const user = c.get('user')
  return ok(c, await getAdminProfileBundle(user.id))
})

adminProfileRoutes.put('/profile', async (c) => {
  const user = c.get('user')
  const input = await parseJson(c, profileUpdateSchema)
  return ok(c, await updateProfile(user.id, input))
})

adminProfileRoutes.post('/social-links', async (c) => {
  const user = c.get('user')
  const input = await parseJson(c, socialLinkInputSchema)
  return okWithStatus(c, await createSocialLink(user.id, input), 201)
})

adminProfileRoutes.put('/social-links/:id', async (c) => {
  const user = c.get('user')
  const input = await parseJson(c, socialLinkInputSchema)
  return ok(c, await updateSocialLink(user.id, c.req.param('id'), input))
})

adminProfileRoutes.delete('/social-links/:id', async (c) => {
  const user = c.get('user')
  await deleteSocialLink(user.id, c.req.param('id'))
  return ok(c, { ok: true })
})

adminProfileRoutes.post('/experiences', async (c) => {
  const user = c.get('user')
  const input = await parseJson(c, experienceInputSchema)
  return okWithStatus(c, await createExperience(user.id, input), 201)
})

adminProfileRoutes.put('/experiences/:id', async (c) => {
  const user = c.get('user')
  const input = await parseJson(c, experienceInputSchema)
  return ok(c, await updateExperience(user.id, c.req.param('id'), input))
})

adminProfileRoutes.delete('/experiences/:id', async (c) => {
  const user = c.get('user')
  await deleteExperience(user.id, c.req.param('id'))
  return ok(c, { ok: true })
})
