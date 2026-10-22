import './scripts/load-env'
import { defineConfig } from 'drizzle-kit'

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

if (!url) {
  throw new Error('缺少 DATABASE_URL_UNPOOLED 或 DATABASE_URL，无法执行数据库迁移')
}

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
  strict: true,
  verbose: true,
})
