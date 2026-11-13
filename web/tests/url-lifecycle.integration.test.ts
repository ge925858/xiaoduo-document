import { beforeEach, describe, expect, it } from 'vitest'
import {
  getArticleDraft,
  listArticleVersions,
  publishArticle,
  saveArticleDraft,
  withdrawArticle,
} from '@/server/articles'
import {
  getPublicChapterByPath,
  resolvePublicRedirect,
} from '@/lib/public-library'
import { createTestConnection, resetTestDatabase } from './test-db'

describe('published URL lifecycle', () => {
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

  it('redirects an old public title path after update publish', async () => {
    const actor = { id: 'owner-1', name: '小多', role: 'owner' as const }
    await publishArticle('article-1', actor)
    const draft = await getArticleDraft('article-1')
    await saveArticleDraft('article-1', {
      title: '新的章节标题',
      categoryId: 'category-1',
      contentJson: { type: 'doc', content: [] },
      markdown: '## 新内容\n\n更新正文',
      plainText: '新内容 更新正文',
      expectedRevision: draft!.revision,
    })
    await publishArticle('article-1', actor)

    expect(
      await resolvePublicRedirect(
        '/library/attention-and-writing/写作不是归档',
      ),
    ).toBe('/library/attention-and-writing/新的章节标题')
  })

  it('redirects an old category path after a category slug change', async () => {
    const actor = { id: 'owner-1', name: '小多', role: 'owner' as const }
    await publishArticle('article-1', actor)
    const connection = await createTestConnection()
    try {
      await connection.query(
        `UPDATE category SET slug = 'attention-writing' WHERE id = 'category-1'`,
      )
    } finally {
      await connection.end()
    }
    const draft = await getArticleDraft('article-1')
    await saveArticleDraft('article-1', {
      title: draft!.title,
      categoryId: 'category-1',
      contentJson: { type: 'doc', content: [] },
      markdown: draft!.markdown,
      plainText: draft!.plainText,
      expectedRevision: draft!.revision,
    })
    await publishArticle('article-1', actor)

    expect(
      await resolvePublicRedirect(
        '/library/attention-and-writing/写作不是归档',
      ),
    ).toBe('/library/attention-writing/写作不是归档')
  })

  it('withdraws public access while preserving versions', async () => {
    await publishArticle('article-1', {
      id: 'owner-1',
      name: '小多',
      role: 'owner',
    })
    expect(await withdrawArticle('article-1')).toBe(true)

    expect(
      await getPublicChapterByPath('attention-and-writing', '写作不是归档'),
    ).toBeNull()
    expect(await listArticleVersions('article-1')).toHaveLength(1)
    expect((await getArticleDraft('article-1'))?.publicationState).toBe(
      'unpublished',
    )
  })
})
