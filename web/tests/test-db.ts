import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import mysql, { type Connection } from 'mysql2/promise'

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  'mysql://root@127.0.0.1:3307/zhijian_test'

function databaseConfig() {
  const url = new URL(databaseUrl)
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
  }
}

export async function createTestConnection(): Promise<Connection> {
  const config = databaseConfig()
  return mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    multipleStatements: true,
  })
}

export async function prepareTestDatabase() {
  const config = databaseConfig()
  const admin = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    multipleStatements: true,
  })
  try {
    await admin.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
    )
    await admin.query(`USE \`${config.database}\``)
    await admin.query('SET FOREIGN_KEY_CHECKS = 0')
    const [tables] = await admin.query<mysql.RowDataPacket[]>(
      `SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
      [config.database],
    )
    for (const table of tables) {
      await admin.query(`DROP TABLE IF EXISTS \`${String(table.name)}\``)
    }
    await admin.query('SET FOREIGN_KEY_CHECKS = 1')

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
        await admin.query(statement)
      }
    }
  } finally {
    await admin.end()
  }
}

export async function resetTestDatabase() {
  await prepareTestDatabase()
}
