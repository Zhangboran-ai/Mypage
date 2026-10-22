import { Hono } from 'hono'
import {
  adminProjectListQuerySchema,
  projectInputSchema,
  projectListQuerySchema,
  reorderSchema,
} from '../../shared/index.js'
import type { AppEnv } from '../types.js'
import { ok, okWithStatus } from '../lib/http.js'
import { parseJson, parseQuery } from '../lib/validate.js'
import {
  createProject,
  deleteProject,
  getAdminProject,
  listAdminProjects,
  listPublicProjects,
  listTechTags,
  reorderProjects,
  updateProject,
} from '../services/project-service.js'
import { triggerDeployHook } from '../lib/deploy-hook.js'

export const adminProjectRoutes = new Hono<AppEnv>()

adminProjectRoutes.get('/projects', async (c) => {
  const query = parseQuery(c, adminProjectListQuerySchema)
  return ok(c, await listAdminProjects(query))
})

adminProjectRoutes.get('/projects/preview', async (c) => {
  const query = parseQuery(c, projectListQuerySchema)
  return ok(c, await listPublicProjects(query))
})

adminProjectRoutes.post('/projects', async (c) => {
  const input = await parseJson(c, projectInputSchema)
  const created = await createProject(input)
  if (input.status !== 'DRAFT') await triggerDeployHook()
  return okWithStatus(c, created, 201)
})

adminProjectRoutes.put('/projects/reorder', async (c) => {
  const input = await parseJson(c, reorderSchema)
  await reorderProjects(input)
  return ok(c, { ok: true })
})

adminProjectRoutes.get('/projects/:id', async (c) => {
  return ok(c, await getAdminProject(c.req.param('id')))
})

adminProjectRoutes.put('/projects/:id', async (c) => {
  const input = await parseJson(c, projectInputSchema)
  const updated = await updateProject(c.req.param('id'), input)
  if (input.status !== 'DRAFT') await triggerDeployHook()
  return ok(c, updated)
})

adminProjectRoutes.delete('/projects/:id', async (c) => {
  await deleteProject(c.req.param('id'))
  return ok(c, { ok: true })
})

adminProjectRoutes.get('/tech-tags', async (c) => {
  return ok(c, await listTechTags())
})
