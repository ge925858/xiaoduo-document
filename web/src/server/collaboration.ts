import { createHash, randomBytes } from 'node:crypto'
import { and, desc, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  article,
  collaborationApplication,
  collaborationInvite,
  collaborationInviteArticle,
} from '@/db/schema'

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export interface ApplicationRecord {
  id: string
  articleId: string
  articleTitle: string
  name: string
  email: string
  note: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
}

export interface InviteRecord {
  id: string
  email: string
  displayName: string | null
  articleIds: string[]
  source: 'application' | 'direct'
  status: 'pending' | 'activated' | 'expired' | 'revoked'
  expiresAt: Date
  createdAt: Date
  token?: string
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

async function inviteArticleIds(inviteId: string) {
  const rows = await db
    .select({ articleId: collaborationInviteArticle.articleId })
    .from(collaborationInviteArticle)
    .where(eq(collaborationInviteArticle.inviteId, inviteId))
  return rows.map((row) => row.articleId)
}

export async function submitApplication(input: {
  articleId: string
  name: string
  email: string
  note: string
}): Promise<ApplicationRecord | 'duplicate'> {
  const email = normalizeEmail(input.email)
  const [target] = await db
    .select({ id: article.id })
    .from(article)
    .where(
      and(
        eq(article.id, input.articleId),
        eq(article.publicationState, 'published'),
        isNull(article.trashedAt),
      ),
    )
    .limit(1)
  if (!target) throw new Error('ARTICLE_NOT_FOUND')

  const existing = await db
    .select({ id: collaborationApplication.id })
    .from(collaborationApplication)
    .where(
      and(
        eq(collaborationApplication.articleId, input.articleId),
        eq(collaborationApplication.email, email),
        eq(collaborationApplication.status, 'pending'),
      ),
    )
    .limit(1)
  if (existing.length) return 'duplicate'

  const id = crypto.randomUUID()
  await db.insert(collaborationApplication).values({
    id,
    articleId: input.articleId,
    name: input.name.trim(),
    email,
    note: input.note.trim(),
    status: 'pending',
  })
  const application = (await listApplications()).find((item) => item.id === id)
  if (!application) throw new Error('APPLICATION_CREATE_FAILED')
  return application
}

export async function listApplications(): Promise<ApplicationRecord[]> {
  return db
    .select({
      id: collaborationApplication.id,
      articleId: collaborationApplication.articleId,
      articleTitle: article.title,
      name: collaborationApplication.name,
      email: collaborationApplication.email,
      note: collaborationApplication.note,
      status: collaborationApplication.status,
      createdAt: collaborationApplication.createdAt,
    })
    .from(collaborationApplication)
    .innerJoin(article, eq(collaborationApplication.articleId, article.id))
    .orderBy(desc(collaborationApplication.createdAt))
}

async function createInvite(input: {
  email: string
  displayName?: string | null
  articleIds: string[]
  source: 'application' | 'direct'
  applicationId?: string | null
}): Promise<InviteRecord> {
  const articleIds = [...new Set(input.articleIds)]
  if (!articleIds.length) throw new Error('NO_ARTICLES')
  const valid = await db
    .select({ id: article.id })
    .from(article)
    .where(and(inArray(article.id, articleIds), isNull(article.trashedAt)))
  if (valid.length !== articleIds.length) throw new Error('ARTICLE_NOT_FOUND')

  const token = randomBytes(32).toString('hex')
  const id = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS)
  await db.transaction(async (transaction) => {
    await transaction.insert(collaborationInvite).values({
      id,
      tokenHash: hashToken(token),
      email: normalizeEmail(input.email),
      displayName: input.displayName?.trim() || null,
      source: input.source,
      applicationId: input.applicationId ?? null,
      status: 'pending',
      expiresAt,
    })
    for (const articleId of articleIds) {
      await transaction.insert(collaborationInviteArticle).values({
        inviteId: id,
        articleId,
      })
    }
  })
  return {
    id,
    email: normalizeEmail(input.email),
    displayName: input.displayName?.trim() || null,
    articleIds,
    source: input.source,
    status: 'pending',
    expiresAt,
    createdAt: new Date(),
    token,
  }
}

export async function createDirectInvite(input: {
  email: string
  displayName?: string
  articleIds: string[]
}) {
  return createInvite({ ...input, source: 'direct' })
}

export async function approveApplication(
  applicationId: string,
): Promise<InviteRecord | null> {
  const [application] = await db
    .select()
    .from(collaborationApplication)
    .where(eq(collaborationApplication.id, applicationId))
    .limit(1)
  if (!application || application.status !== 'pending') return null

  const invite = await createInvite({
    email: application.email,
    displayName: application.name,
    articleIds: [application.articleId],
    source: 'application',
    applicationId: application.id,
  })
  await db
    .update(collaborationApplication)
    .set({ status: 'approved', reviewedAt: new Date() })
    .where(eq(collaborationApplication.id, applicationId))
  return invite
}

export async function rejectApplication(applicationId: string) {
  const [application] = await db
    .select({ id: collaborationApplication.id })
    .from(collaborationApplication)
    .where(
      and(
        eq(collaborationApplication.id, applicationId),
        eq(collaborationApplication.status, 'pending'),
      ),
    )
    .limit(1)
  if (!application) return false
  await db
    .update(collaborationApplication)
    .set({ status: 'rejected', reviewedAt: new Date() })
    .where(eq(collaborationApplication.id, applicationId))
  return true
}

export async function listInvites(): Promise<InviteRecord[]> {
  const invites = await db
    .select()
    .from(collaborationInvite)
    .orderBy(desc(collaborationInvite.createdAt))
  return Promise.all(
    invites.map(async (invite) => ({
      id: invite.id,
      email: invite.email,
      displayName: invite.displayName,
      articleIds: await inviteArticleIds(invite.id),
      source: invite.source,
      status: invite.status,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
    })),
  )
}
