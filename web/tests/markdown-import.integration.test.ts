import { beforeEach, describe, expect, it } from 'vitest'
import {
  getArticleDraft,
  listArticleDrafts,
} from '@/server/articles'
import { importMarkdownDraft } from '@/server/article-import'
import { createTestConnection, resetTestDatabase } from './test-db'

describe('markdown import service', () => {
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
          'article-1', 'category-1', '已有章节', '已有章节', 1,
          '## 已有', '已有', 1, 'draft', NOW(3), NOW(3)
        )`,
      )
    } finally {
      await connection.end()
    }
  })

  it('imports a Markdown file as a new draft at category end', async () => {
    const article = await importMarkdownDraft({
      categoryId: 'category-1',
      fileName: '写作与整理.md',
      markdown: '## 一节\n\n正文内容\n\n- 列表项',
    })
    const saved = await getArticleDraft(article.id)
    expect(saved).toMatchObject({
      title: '写作与整理',
      categoryId: 'category-1',
      publicationState: 'draft',
      markdown: '## 一节\n\n正文内容\n\n- 列表项',
      sourceFileName: '写作与整理.md',
    })
    expect(saved?.plainText).toContain('正文内容')
    expect(
      (await listArticleDrafts()).filter(
        (item) => item.categoryId === 'category-1',
      ).at(-1)?.id,
    ).toBe(article.id)
  })

  it('rejects empty content and unsupported file types without partial writes', async () => {
    await expect(
      importMarkdownDraft({
        categoryId: 'category-1',
        fileName: 'empty.md',
        markdown: '   ',
      }),
    ).rejects.toThrow('EMPTY_MARKDOWN')
    await expect(
      importMarkdownDraft({
        categoryId: 'category-1',
        fileName: 'notes.txt',
        markdown: '# 内容',
      }),
    ).rejects.toThrow('UNSUPPORTED_FILE')
    expect(await listArticleDrafts()).toHaveLength(1)
  })
})
