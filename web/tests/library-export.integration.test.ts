import { beforeEach, describe, expect, it } from 'vitest'
import { createLibraryExport } from '@/server/library-export'
import { createTestConnection, resetTestDatabase } from './test-db'

describe('library export', () => {
  beforeEach(async () => {
    await resetTestDatabase()
    const connection = await createTestConnection()
    try {
      await connection.query(
        `INSERT INTO category (id, title, slug, position) VALUES
          ('category-1', '注意力与写作', 'attention-and-writing', 1),
          ('category-2', '工具与方法', 'tools', 2)`,
      )
      await connection.query(
        `INSERT INTO article (
          id, category_id, title, path, position, markdown, plain_text,
          revision, publication_state, created_at, updated_at
        ) VALUES
          ('article-1', 'category-1', '写作不是归档', '写作不是归档', 1,
           '# 写作不是归档\\n\\n![图](https://cdn.example.com/a.webp)',
           '写作不是归档', 3, 'published', NOW(3), NOW(3)),
          ('article-2', 'category-2', '工具清单', '工具清单', 1,
           '# 工具清单', '工具清单', 1, 'draft', NOW(3), NOW(3))`,
      )
      await connection.query(
        `INSERT INTO auth_user (
          id, name, email, email_verified, role, status, created_at, updated_at
        ) VALUES (
          'collaborator-1', '协作者甲', 'export@example.com', true,
          'collaborator', 'active', NOW(3), NOW(3)
        )`,
      )
      await connection.query(
        `INSERT INTO auth_account (
          id, account_id, provider_id, user_id, password, created_at, updated_at
        ) VALUES (
          'account-1', 'collaborator-1', 'credential', 'collaborator-1',
          'SECRET_PASSWORD_HASH', NOW(3), NOW(3)
        )`,
      )
      await connection.query(
        `INSERT INTO auth_session (
          id, user_id, token, expires_at, created_at, updated_at
        ) VALUES (
          'session-1', 'collaborator-1', 'SECRET_SESSION_TOKEN',
          DATE_ADD(NOW(3), INTERVAL 1 DAY), NOW(3), NOW(3)
        )`,
      )
      await connection.query(
        `INSERT INTO article_version (
          id, article_id, kind, title, category_id, category_slug, path,
          markdown, plain_text, author_id, author_name, author_role, created_at
        ) VALUES (
          'version-1', 'article-1', 'published', '写作不是归档', 'category-1',
          'attention-and-writing', '写作不是归档', '# 写作不是归档',
          '写作不是归档', 'owner-1', '小多', 'owner', NOW(3)
        )`,
      )
      await connection.query(
        `INSERT INTO article_grant (user_id, article_id, created_at)
         VALUES ('collaborator-1', 'article-1', NOW(3))`,
      )
      await connection.query(
        `INSERT INTO collaboration_invite (
          id, token_hash, email, source, status, expires_at, created_at
        ) VALUES (
          'invite-1', 'SECRET_INVITE_HASH', 'export@example.com', 'direct',
          'pending', DATE_ADD(NOW(3), INTERVAL 1 DAY), NOW(3)
        )`,
      )
      await connection.query(
        `INSERT INTO collaboration_password_reset (
          id, user_id, email, token_hash, status, expires_at, created_at
        ) VALUES (
          'reset-1', 'collaborator-1', 'export@example.com',
          'SECRET_RESET_HASH', 'pending',
          DATE_ADD(NOW(3), INTERVAL 1 HOUR), NOW(3)
        )`,
      )
      await connection.query(
        `INSERT INTO article_view_event (
          id, article_id, visitor_ip, visitor_hash, location, referrer_domain,
          visited_at
        ) VALUES (
          'view-1', 'article-1', '203.0.113.50', 'SECRET_VISITOR_HASH',
          '广东省 深圳市', 'google.com', NOW(3)
        )`,
      )
    } finally {
      await connection.end()
    }
  })

  it('exports portable Markdown and metadata without credentials or visitor data', async () => {
    const result = await createLibraryExport()
    expect(result.zip.subarray(0, 2).toString()).toBe('PK')
    expect(result.files.map((file) => file.path)).toEqual(
      expect.arrayContaining([
        'README.md',
        'metadata.json',
        expect.stringMatching(/^markdown\/01-attention-and-writing\/01-.*\.md$/),
        expect.stringMatching(/^markdown\/02-tools\/01-.*\.md$/),
      ]),
    )
    expect(
      result.files.find((file) => file.path.startsWith('markdown/01-'))?.content,
    ).toContain('![图](https://cdn.example.com/a.webp)')
    expect(result.metadata.categories.map((item) => item.slug)).toEqual([
      'attention-and-writing',
      'tools',
    ])
    expect(result.metadata.articles).toHaveLength(2)
    expect(result.metadata.versions[0]).toMatchObject({
      authorName: '小多',
      authorRole: 'owner',
    })
    expect(result.metadata.collaborators[0]).toMatchObject({
      email: 'export@example.com',
      status: 'active',
    })
    expect(result.metadata.grants).toEqual([
      { userId: 'collaborator-1', articleId: 'article-1' },
    ])

    const serialized = [
      JSON.stringify(result.metadata),
      ...result.files.map((file) => file.content),
    ].join('\n')
    for (const secret of [
      'SECRET_PASSWORD_HASH',
      'SECRET_SESSION_TOKEN',
      'SECRET_INVITE_HASH',
      'SECRET_RESET_HASH',
      'SECRET_VISITOR_HASH',
      '203.0.113.50',
    ]) {
      expect(serialized).not.toContain(secret)
    }
  })
})
