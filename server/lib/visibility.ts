import { and, eq, isNull, or, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { posts, projects } from '../../db/schema.js'

/**
 * 公开可见性：未删除，且已发布；或者定时发布且到达数据库当前时间。
 * 时间判断一律交给数据库，避免客户端/函数实例时钟漂移。
 */
export function postVisibleCondition(): SQL {
  return (
    and(
      isNull(posts.deletedAt),
      or(
        eq(posts.status, 'PUBLISHED'),
        and(eq(posts.status, 'SCHEDULED'), sql`${posts.publishedAt} <= now()`),
      ),
    ) ?? sql`true`
  )
}

export function projectVisibleCondition(): SQL {
  return (
    and(
      isNull(projects.deletedAt),
      or(
        eq(projects.status, 'PUBLISHED'),
        and(eq(projects.status, 'SCHEDULED'), sql`${projects.publishedAt} <= now()`),
      ),
    ) ?? sql`true`
  )
}
