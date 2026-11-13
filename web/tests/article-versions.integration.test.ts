import { beforeEach, describe, expect, it } from 'vitest'
import {
  getArticleDraft,
  listArticleVersions,
  restoreArticleVersion,
  saveArticleDraft,
  saveManualVersion,
} from '@/server/articles'
import { createTestConnection, resetTestDatabase } from './test-db'

describe('article version service', () => {
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

  it('creates immutable manual versions with an author snapshot', async () => {
    const draft = await getArticleDraft('article-1')
    await saveArticleDraft('article-1', {
      title: draft!.title,
      categoryId: draft!.categoryId,
      contentJson: { type: 'doc', content: [] },
      markdown: '## 手动版本\n\n第一版内容',
      plainText: '手动版本 第一版内容',
      expectedRevision: draft!.revision,
    })
    expect(await listArticleVersions('article-1')).toHaveLength(0)

    const version = await saveManualVersion('article-1', {
      label: '整理后的快照',
      actor: {
        id: 'owner-1',
        name: '小多',
        role: 'owner',
      },
    })
    expect(version).toMatchObject({
      label: '整理后的快照',
      kind: 'manual',
      authorId: 'owner-1',
      authorName: '小多',
      authorRole: 'owner',
      markdown: '## 手动版本\n\n第一版内容',
    })

    const current = await getArticleDraft('article-1')
    await saveArticleDraft('article-1', {
      title: '后续标题',
      categoryId: current!.categoryId,
      contentJson: { type: 'doc', content: [] },
      markdown: '后续内容',
      plainText: '后续内容',
      expectedRevision: current!.revision,
    })

    expect((await listArticleVersions('article-1'))[0]).toMatchObject({
      id: version.id,
      markdown: '## 手动版本\n\n第一版内容',
      title: '写作不是归档',
    })
  })

  it('restores a version only into the current draft', async () => {
    const version = await saveManualVersion('article-1', {
      actor: { id: 'owner-1', name: '小多', role: 'owner' },
    })
    const before = await getArticleDraft('article-1')

    expect(await restoreArticleVersion('article-1', version.id)).toBe('saved')
    const after = await getArticleDraft('article-1')
    expect(after).toMatchObject({
      title: '写作不是归档',
      markdown: '## 初稿\n\n正文',
      publicationState: 'draft',
      revision: before!.revision + 1,
    })
  })
})
