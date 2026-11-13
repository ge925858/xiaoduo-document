import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/client'
import { session } from '@/db/schema'
import { auth } from '@/lib/auth'
import {
  createCollaboratorPasswordReset,
  resetCollaboratorPassword,
  setCollaboratorStatus,
} from '@/server/collaboration'
import { createTestConnection, resetTestDatabase } from './test-db'

describe('collaboration management and password reset', () => {
  beforeEach(async () => {
    await resetTestDatabase()
    const connection = await createTestConnection()
    try {
      await connection.query(
        `INSERT INTO auth_user (
          id, name, email, email_verified, role, status, created_at, updated_at
        ) VALUES (
          'collaborator-1', '协作者甲', 'managed@example.com', true,
          'collaborator', 'active', NOW(3), NOW(3)
        )`,
      )
    } finally {
      await connection.end()
    }
  })

  async function createManagedAccount(password: string) {
    const connection = await createTestConnection()
    try {
      const { hashPassword } = await import('better-auth/crypto')
      await connection.query(
        `INSERT INTO auth_account (
          id, account_id, provider_id, user_id, password, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))`,
        [
          'account-1',
          'collaborator-1',
          'credential',
          'collaborator-1',
          await hashPassword(password),
        ],
      )
    } finally {
      await connection.end()
    }
  }

  it('revokes sessions on suspension and restores access without losing grants', async () => {
    await createManagedAccount('initial-password')
    await auth.api.signInEmail({
      body: {
        email: 'managed@example.com',
        password: 'initial-password',
      },
    })
    expect(
      await db
        .select()
        .from(session)
        .where(eq(session.userId, 'collaborator-1')),
    ).toHaveLength(1)

    expect(await setCollaboratorStatus('collaborator-1', 'suspended')).toBe(
      true,
    )
    expect(
      await db
        .select()
        .from(session)
        .where(eq(session.userId, 'collaborator-1')),
    ).toHaveLength(0)
    expect(await setCollaboratorStatus('collaborator-1', 'active')).toBe(true)
  })

  it('uses a password reset token once and replaces the credential password', async () => {
    await createManagedAccount('old-password-value')
    const reset = await createCollaboratorPasswordReset('collaborator-1')

    expect(
      await resetCollaboratorPassword(reset.token, 'new-password-value'),
    ).toBe('reset')
    expect(
      await resetCollaboratorPassword(reset.token, 'another-password'),
    ).toBe('used')

    await expect(
      auth.api.signInEmail({
        body: {
          email: 'managed@example.com',
          password: 'old-password-value',
        },
      }),
    ).rejects.toThrow()
    const login = await auth.api.signInEmail({
      body: {
        email: 'managed@example.com',
        password: 'new-password-value',
      },
    })
    expect(login.user.email).toBe('managed@example.com')
  })
})
