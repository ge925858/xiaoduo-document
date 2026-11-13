import { pool } from '@/db/client'
import { purgeExpiredTrash } from '@/server/articles'

const deleted = await purgeExpiredTrash()
console.log(JSON.stringify({ event: 'trash_purged', deleted }))
await pool.end()
