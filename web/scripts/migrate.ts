import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import mysql from 'mysql2/promise'

const databaseUrl =
  process.env.DATABASE_URL ??
  'mysql://root@127.0.0.1:3307/zhijian_test'
const url = new URL(databaseUrl)
const database = url.pathname.replace(/^\//, '')

const connection = await mysql.createConnection({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  multipleStatements: true,
})

try {
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
  )
  await connection.query(`USE \`${database}\``)
  const migrationDirectory = path.join(process.cwd(), 'drizzle')
  const files = (await readdir(migrationDirectory))
    .filter((file) => file.endsWith('.sql'))
    .sort()
  for (const file of files) {
    const migration = await readFile(
      path.join(migrationDirectory, file),
      'utf8',
    )
    for (const statement of migration
      .split('--> statement-breakpoint')
      .map((part) => part.trim())
      .filter(Boolean)) {
      await connection.query(statement)
    }
  }
} finally {
  await connection.end()
}
