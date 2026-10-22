import { Hono } from 'hono'
import { reorderSchema, skillCategoryInputSchema, skillInputSchema } from '../../shared/index.js'
import type { AppEnv } from '../types.js'
import { ok, okWithStatus } from '../lib/http.js'
import { parseJson } from '../lib/validate.js'
import {
  createSkill,
  createSkillCategory,
  deleteSkill,
  deleteSkillCategory,
  listAllSkillCategories,
  reorderSkills,
  updateSkill,
  updateSkillCategory,
} from '../services/skill-service.js'

export const adminSkillRoutes = new Hono<AppEnv>()

adminSkillRoutes.get('/skills', async (c) => {
  return ok(c, await listAllSkillCategories())
})

adminSkillRoutes.put('/skills/reorder', async (c) => {
  const input = await parseJson(c, reorderSchema)
  await reorderSkills(input)
  return ok(c, { ok: true })
})

adminSkillRoutes.post('/skill-categories', async (c) => {
  const input = await parseJson(c, skillCategoryInputSchema)
  return okWithStatus(c, await createSkillCategory(input), 201)
})

adminSkillRoutes.put('/skill-categories/:id', async (c) => {
  const input = await parseJson(c, skillCategoryInputSchema)
  return ok(c, await updateSkillCategory(c.req.param('id'), input))
})

adminSkillRoutes.delete('/skill-categories/:id', async (c) => {
  await deleteSkillCategory(c.req.param('id'))
  return ok(c, { ok: true })
})

adminSkillRoutes.post('/skills', async (c) => {
  const input = await parseJson(c, skillInputSchema)
  return okWithStatus(c, await createSkill(input), 201)
})

adminSkillRoutes.put('/skills/:id', async (c) => {
  const input = await parseJson(c, skillInputSchema)
  return ok(c, await updateSkill(c.req.param('id'), input))
})

adminSkillRoutes.delete('/skills/:id', async (c) => {
  await deleteSkill(c.req.param('id'))
  return ok(c, { ok: true })
})
