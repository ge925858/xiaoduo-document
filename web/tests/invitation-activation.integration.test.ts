import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/client'
import {
  account,
  articleGrant,
  collaborationInvite,
  collaborationInviteArticle,
  session,
  user,
} from '@/db/schema'
import { auth } from '@/lib/auth'
import {
  activateInvitation,
  createDirectInvite,
} from '@/server/collaboration'
import { createTestConnection, resetTestDatabase } from './test-db'

describe('invitation activation and collaborator sessions', () => {
  beforeEach(async () => {
    await resetTestDatabase()
    const connection = await createTestConnection()
    try {
      await connection.query(
        `INSERT INTO category (id, title, slug, position)
         VALUES ('category-1', '注意力与写作', 'attention-and-writing', 1)`,
      )
      await connection.query(
        `INSERT INTO article (
          id, category_id, title, path, position, markdown, plain_text,
          revision, publication_state, created_at, updated_at
        ) VALUES (
          'article-1', 'category-1', '写作不是归档', '写作不是归档', 1,
          '正文', '正文', 1, 'published', NOW(3), NOW(3)
        )`,
      )
    } finally {
      await connection.end()
    }
  })

  it('activates a valid invitation into a collaborator account that can log in', async () => {
    const invite = await createDirectInvite({
      email: 'COLLAB@example.com',
      displayName: '申请昵称',
      articleIds: ['article-1'],
    })

    const result = await activateInvitation({
      token: invite.token!,
      displayName: '协作者甲',
      password: 'secure-password-123',
    })

    expect(result).toMatchObject({
      status: 'activated',
      email: 'collab@example.com',
      displayName: '协作者甲',
    })

    const [activatedInvite] = await db
      .select()
      .from(collaborationInvite)
      .where(eq(collaborationInvite.id, invite.id))
    expect(activatedInvite.status).toBe('activated')

    const [accountUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, 'collab@example.com'))
    expect(accountUser).toMatchObject({
      name: '协作者甲',
      role: 'collaborator',
      status: 'active',
    })

    const [credentialAccount] = await db
      .select()
      .from(account)
      .where(eq(account.userId, accountUser.id))
    expect(credentialAccount).toMatchObject({
      providerId: 'credential',
      accountId: accountUser.id,
    })
    expect(credentialAccount.password).not.toBe('secure-password-123')

    const grants = await db
      .select()
      .from(collaborationInviteArticle)
      .where(eq(collaborationInviteArticle.inviteId, invite.id))
    expect(grants).toEqual([
      expect.objectContaining({ articleId: 'article-1' }),
    ])
    expect(
      await db
        .select()
        .from(articleGrant)
        .where(eq(articleGrant.userId, accountUser.id)),
    ).toEqual([expect.objectContaining({ articleId: 'article-1' })])

    await auth.api.signInEmail({
      body: {
        email: 'collab@example.com',
        password: 'secure-password-123',
      },
    })
    const sessions = await db
      .select()
      .from(session)
      .where(eq(session.userId, accountUser.id))
    expect(sessions).toHaveLength(1)

    await db
      .update(collaborationInvite)
      .set({
        status: 'expired',
        expiresAt: new Date(Date.now() - 1_000),
      })
      .where(eq(collaborationInvite.id, invite.id))
    const laterLogin = await auth.api.signInEmail({
      body: {
        email: 'collab@example.com',
        password: 'secure-password-123',
      },
    })
    expect(laterLogin.user.email).toBe('collab@example.com')
  })

  it('returns an explicit result when an invitation was already activated', async () => {
    const invite = await createDirectInvite({
      email: 'collab@example.com',
      articleIds: ['article-1'],
    })
    await activateInvitation({
      token: invite.token!,
      displayName: '协作者甲',
      password: 'first-password-123',
    })

    expect(
      await activateInvitation({
        token: invite.token!,
        displayName: '重复激活',
        password: 'second-password-123',
      }),
    ).toEqual({ status: 'already-activated' })
  })

  it('expires an invitation after its deadline without creating an account', async () => {
    const invite = await createDirectInvite({
      email: 'expired@example.com',
      articleIds: ['article-1'],
    })
    await db
      .update(collaborationInvite)
      .set({ expiresAt: new Date(Date.now() - 1_000) })
      .where(eq(collaborationInvite.id, invite.id))

    expect(
      await activateInvitation({
        token: invite.token!,
        displayName: '过期协作者',
        password: 'secure-password-123',
      }),
    ).toEqual({ status: 'expired' })
    const [expiredInvite] = await db
      .select()
      .from(collaborationInvite)
      .where(eq(collaborationInvite.id, invite.id))
    expect(expiredInvite.status).toBe('expired')
    expect(
      await db
        .select()
        .from(user)
        .where(eq(user.email, 'expired@example.com')),
    ).toHaveLength(0)
  })

  it('returns an explicit result for a revoked invitation', async () => {
    const invite = await createDirectInvite({
      email: 'revoked@example.com',
      articleIds: ['article-1'],
    })
    await db
      .update(collaborationInvite)
      .set({ status: 'revoked' })
      .where(eq(collaborationInvite.id, invite.id))

    expect(
      await activateInvitation({
        token: invite.token!,
        displayName: '撤销协作者',
        password: 'secure-password-123',
      }),
    ).toEqual({ status: 'revoked' })
    expect(
      await db
        .select()
        .from(user)
        .where(eq(user.email, 'revoked@example.com')),
    ).toHaveLength(0)
  })
})
