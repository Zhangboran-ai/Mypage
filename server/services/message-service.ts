import { and, desc, eq, gte, sql } from 'drizzle-orm'
import type {
  ContactMessageInput,
  Message,
  MessageListQuery,
  Paginated,
} from '../../shared/index.js'
import { contactMessages } from '../../db/schema.js'
import { db } from '../lib/db.js'
import { notFound, rateLimited } from '../lib/errors.js'
import { mapMessage } from '../lib/mappers.js'
import { buildPaginationMeta, getPagination } from '../lib/pagination.js'

const MESSAGE_WINDOW_MINUTES = 10
const MESSAGE_LIMIT_PER_WINDOW = 3

type MessageMeta = { ip: string | null; userAgent: string | null }

export async function createMessage(
  input: ContactMessageInput,
  meta: MessageMeta,
): Promise<void> {
  // 蜜罐字段被填写时静默丢弃，不给机器人反馈
  if (input.website && input.website.length > 0) return

  if (meta.ip) {
    const since = new Date(Date.now() - MESSAGE_WINDOW_MINUTES * 60 * 1000)
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contactMessages)
      .where(and(eq(contactMessages.ip, meta.ip), gte(contactMessages.createdAt, since)))

    if ((row?.count ?? 0) >= MESSAGE_LIMIT_PER_WINDOW) {
      throw rateLimited('留言过于频繁，请稍后再试')
    }
  }

  await db.insert(contactMessages).values({
    name: input.name,
    email: input.email ? input.email : null,
    content: input.content,
    ip: meta.ip?.slice(0, 64) ?? null,
    userAgent: meta.userAgent?.slice(0, 500) ?? null,
  })
}

export async function listMessages(
  query: MessageListQuery,
): Promise<Paginated<Message>> {
  const { limit, offset } = getPagination(query.page, query.pageSize)

  const [countRow] = await db.select({ count: sql<number>`count(*)::int` }).from(contactMessages)

  const rows = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt))
    .limit(limit)
    .offset(offset)

  return {
    data: rows.map(mapMessage),
    meta: buildPaginationMeta(countRow?.count ?? 0, query.page, query.pageSize),
  }
}

export async function markMessageRead(id: string, read: boolean): Promise<Message> {
  const [row] = await db
    .update(contactMessages)
    .set({ read })
    .where(eq(contactMessages.id, id))
    .returning()

  if (!row) throw notFound('留言不存在')
  return mapMessage(row)
}

export async function deleteMessage(id: string): Promise<void> {
  const deleted = await db
    .delete(contactMessages)
    .where(eq(contactMessages.id, id))
    .returning({ id: contactMessages.id })

  if (deleted.length === 0) throw notFound('留言不存在')
}
