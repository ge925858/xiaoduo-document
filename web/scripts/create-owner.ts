import { eq } from 'drizzle-orm'
import { hashPassword } from 'better-auth/crypto'
import { db, pool } from '@/db/client'
import { account, siteProfile, user } from '@/db/schema'

const email = process.env.OWNER_EMAIL?.trim().toLowerCase()
const password = process.env.OWNER_PASSWORD
const name = process.env.OWNER_NAME?.trim()

if (!email || !password || !name) {
  throw new Error('OWNER_EMAIL, OWNER_PASSWORD and OWNER_NAME are required')
}

const [existing] = await db
  .select({ id: user.id })
  .from(user)
  .where(eq(user.email, email))
  .limit(1)

const ownerId = existing?.id ?? crypto.randomUUID()
if (!existing) {
  await db.insert(user).values({
    id: ownerId,
    name,
    email,
    emailVerified: true,
    role: 'owner',
    status: 'active',
  })
  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: ownerId,
    providerId: 'credential',
    userId: ownerId,
    password: await hashPassword(password),
  })
}

await db
  .insert(siteProfile)
  .values({
    id: 'primary',
    authorName: name,
    roleTitle: '站主',
    intro: '',
    nowText: '',
    location: '',
    email,
  })
  .onDuplicateKeyUpdate({
    set: { authorName: name, email },
  })

await pool.end()
