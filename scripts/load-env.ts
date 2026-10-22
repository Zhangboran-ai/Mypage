import { config } from 'dotenv'

/**
 * 本地脚本统一的环境变量加载入口。
 * Vercel 会直接注入环境变量，此时两个文件都不存在，config 会静默跳过；
 * 顺序保持 .env.local 优先，且不覆盖进程里已有的变量。
 */
config({ path: '.env.local', quiet: true })
config({ path: '.env', quiet: true })
