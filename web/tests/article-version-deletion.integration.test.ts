import { beforeEach, describe, expect, it } from 'vitest'
import {
  deleteArticleVersion,
  listArticleVersions,
  publishArticle,
  saveManualVersion,
} from '@/server/articles'
import { createTestConnection, resetTestDatabase } from './test-db'

describe('article version deletion', () => {
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
          content_json, revision, publication_state, created_at, updated_at
        ) VALUES (
          'article-1', 'category-1', '写作不是归档', '写作不是归档', 1,
          '## 初稿\\n\\n正文', '初稿 正文',
          '{"type":"doc","content":[]}', 1, 'draft', NOW(3), NOW(3)
        )`,
      )
    } finally {
      await connection.end()
    }
  })

  it('lets the owner delete a manual version', async () => {
    const version = await saveManualVersion('article-1', {
      actor: { id: 'owner-1', name: '小多', role: 'owner' },
    })

    expect(
      await deleteArticleVersion('article-1', version.id, {
        id: 'owner-1',
        role: 'owner',
      }),
    ).toBe('deleted')
    expect(await listArticleVersions('article-1')).toEqual([])
  })

  it('never deletes a published version', async () => {
    await publishArticle('article-1', {
      id: 'owner-1',
      name: '小多',
      role: 'owner',
    })
    const [published] = await listArticleVersions('article-1')

    expect(
      await deleteArticleVersion('article-1', published.id, {
        id: 'owner-1',
        role: 'owner',
      }),
    ).toBe('published')
    expect(await listArticleVersions('article-1')).toHaveLength(1)
  })

  it('limits collaborators to deleting their own manual versions', async () => {
    const version = await saveManualVersion('article-1', {
      actor: {
        id: 'collaborator-1',
        name: '协作者甲',
        role: 'collaborator',
      },
    })

    expect(
      await deleteArticleVersion('article-1', version.id, {
        id: 'collaborator-2',
        role: 'collaborator',
      }),
    ).toBe('forbidden')
    expect(await listArticleVersions('article-1')).toHaveLength(1)

    expect(
      await deleteArticleVersion('article-1', version.id, {
        id: 'collaborator-1',
        role: 'collaborator',
      }),
    ).toBe('deleted')
    expect(await listArticleVersions('article-1')).toEqual([])
  })

  it('reports a missing version without changing the log', async () => {
    expect(
      await deleteArticleVersion('article-1', 'missing-version', {
        id: 'owner-1',
        role: 'owner',
      }),
    ).toBe('missing')
    expect(await listArticleVersions('article-1')).toEqual([])
  })
})
