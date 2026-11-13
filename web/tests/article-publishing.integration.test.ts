import { beforeEach, describe, expect, it } from 'vitest'
import {
  getArticleDraft,
  listArticleVersions,
  publishArticle,
  saveArticleDraft,
} from '@/server/articles'
import { getPublicChapterByPath } from '@/lib/public-library'
import { createTestConnection, resetTestDatabase } from './test-db'

describe('article publishing service', () => {
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

  it('publishes an immutable version with the author snapshot', async () => {
    const result = await publishArticle('article-1', {
      id: 'owner-1',
      name: '小多',
      role: 'owner',
    })
    expect(result).toBe('published')

    const publicChapter = await getPublicChapterByPath(
      'attention-and-writing',
      '写作不是归档',
    )
    expect(publicChapter).toMatchObject({
      title: '写作不是归档',
      authorName: '小多',
      markdown: '## 初稿\n\n正文',
    })

    const version = (await listArticleVersions('article-1'))[0]
    expect(version).toMatchObject({
      kind: 'published',
      authorId: 'owner-1',
      authorName: '小多',
      authorRole: 'owner',
    })
  })

  it('keeps the published version online until the next publish', async () => {
    await publishArticle('article-1', {
      id: 'owner-1',
      name: '小多',
      role: 'owner',
    })
    const draft = await getArticleDraft('article-1')
    await saveArticleDraft('article-1', {
      title: '新的公开标题',
      categoryId: 'category-1',
      contentJson: { type: 'doc', content: [] },
      markdown: '## 更新后\n\n新内容',
      plainText: '更新后 新内容',
      expectedRevision: draft!.revision,
    })

    expect(
      await getPublicChapterByPath('attention-and-writing', '写作不是归档'),
    ).not.toBeNull()
    expect(
      await getPublicChapterByPath('attention-and-writing', '新的公开标题'),
    ).toBeNull()

    await publishArticle('article-1', {
      id: 'owner-1',
      name: '小多',
      role: 'owner',
    })
    expect(
      await getPublicChapterByPath('attention-and-writing', '新的公开标题'),
    ).not.toBeNull()
    expect(
      await getPublicChapterByPath('attention-and-writing', '写作不是归档'),
    ).toBeNull()
  })
})
