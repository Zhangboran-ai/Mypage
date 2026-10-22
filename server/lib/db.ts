import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../../db/schema'
import { env } from '../env'

function createDatabase() {
  const client = postgres(env.DATABASE_URL, {
    prepare: false,
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
  })

  return drizzle(client, { schema })
}

type Database = ReturnType<typeof createDatabase>

const globalForDb = globalThis as unknown as { __astraDb?: Database }

export const db: Database = globalForDb.__astraDb ?? createDatabase()

// 复用实例，避免本地 HMR 反复建立连接
if (env.NODE_ENV !== 'production') {
  globalForDb.__astraDb = db
}
