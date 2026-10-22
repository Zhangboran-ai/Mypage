import { Hono } from 'hono'
import { messageListQuerySchema, messageUpdateSchema } from '../../shared/index.js'
import type { AppEnv } from '../types.js'
import { ok } from '../lib/http.js'
import { parseJson, parseQuery } from '../lib/validate.js'
import { deleteMessage, listMessages, markMessageRead } from '../services/message-service.js'

export const adminMessageRoutes = new Hono<AppEnv>()

adminMessageRoutes.get('/messages', async (c) => {
  const query = parseQuery(c, messageListQuerySchema)
  return ok(c, await listMessages(query))
})

adminMessageRoutes.patch('/messages/:id', async (c) => {
  const input = await parseJson(c, messageUpdateSchema)
  return ok(c, await markMessageRead(c.req.param('id'), input.read))
})

adminMessageRoutes.delete('/messages/:id', async (c) => {
  await deleteMessage(c.req.param('id'))
  return ok(c, { ok: true })
})
