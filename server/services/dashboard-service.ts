import { and, eq, isNull, sql } from 'drizzle-orm'
import type { Dashboard } from '../../shared/index.js'
import { contactMessages, posts, projects, skills } from '../../db/schema.js'
import { db } from '../lib/db.js'
import { listRecentAdminPosts } from './post-service.js'

export async function getDashboard(): Promise<Dashboard> {
  const [
    postsCount,
    draftsCount,
    projectsCount,
    skillsCount,
    unreadMessages,
    recentPosts,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(isNull(posts.deletedAt)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(and(isNull(posts.deletedAt), eq(posts.status, 'DRAFT'))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(isNull(projects.deletedAt)),
    db.select({ count: sql<number>`count(*)::int` }).from(skills),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(contactMessages)
      .where(eq(contactMessages.read, false)),
    listRecentAdminPosts(5),
  ])

  return {
    stats: {
      posts: postsCount[0]?.count ?? 0,
      drafts: draftsCount[0]?.count ?? 0,
      projects: projectsCount[0]?.count ?? 0,
      skills: skillsCount[0]?.count ?? 0,
      unreadMessages: unreadMessages[0]?.count ?? 0,
    },
    recentPosts,
  }
}
