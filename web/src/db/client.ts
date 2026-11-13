import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

const databaseUrl =
  process.env.DATABASE_URL ??
  'mysql://root@127.0.0.1:3307/zhijian_test'

const globalForDatabase = globalThis as typeof globalThis & {
  zhijianPool?: mysql.Pool
}

const pool =
  globalForDatabase.zhijianPool ??
  mysql.createPool({
    uri: databaseUrl,
    connectionLimit: 10,
    enableKeepAlive: true,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForDatabase.zhijianPool = pool
}

export const db = drizzle(pool, { schema, mode: 'default' })
export { pool }
