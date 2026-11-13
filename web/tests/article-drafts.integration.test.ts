import { beforeEach, describe, expect, it } from 'vitest'
import {
  createArticleDraft,
  getArticleDraft,
  listArticleDrafts,
  moveArticleDraft,
  saveArticleDraft,
} from '@/server/articles'
import { createTestConnection, resetTestDatabase } from './test-db'

describe('article draft service', () => {
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
        ) VALUES (
          'article-1', 'category-1', '写作不是归档', '写作不是归档', 1,
          '## 初稿\\n\\n正文', '初稿 正文', 1, 'draft', NOW(3), NOW(3)
        )`,
      )
    } finally {
      await connection.end()
    }
  })

  it('creates a draft at the end of its category', async () => {
    const created = await createArticleDraft({
      categoryId: 'category-1',
      title: '无标题章节',
    })

    expect(created).toMatchObject({
      categoryId: 'category-1',
      title: '无标题章节',
      revision: 1,
      publicationState: 'draft',
    })
    const drafts = await listArticleDrafts()
    expect(
      drafts.filter((item) => item.categoryId === 'category-1').at(-1)?.id,
    ).toBe(created.id)
  })

  it('persists JSON, canonical Markdown and plain text under a revision', async () => {
    const original = await getArticleDraft('article-1')
    expect(original).not.toBeNull()

    const contentJson = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '新的小节' }],
        },
      ],
    }
    const saved = await saveArticleDraft('article-1', {
      title: '新的章节标题',
      categoryId: 'category-1',
      contentJson,
      markdown: '## 新的小节\n',
      plainText: '新的小节',
      expectedRevision: original!.revision,
    })
    expect(saved).toBe('saved')

    const current = await getArticleDraft('article-1')
    expect(current).toMatchObject({
      title: '新的章节标题',
      path: '新的章节标题',
      markdown: '## 新的小节\n',
      plainText: '新的小节',
      revision: original!.revision + 1,
    })
    expect(JSON.parse(current!.contentJson ?? '{}')).toEqual(contentJson)

    expect(
      await saveArticleDraft('article-1', {
        title: '过期保存',
        categoryId: 'category-1',
        contentJson,
        markdown: '过期',
        plainText: '过期',
        expectedRevision: original!.revision,
      }),
    ).toBe('conflict')
  })

  it('moves drafts within the same category without timestamp-driven reorder', async () => {
    await createArticleDraft({
      categoryId: 'category-1',
      title: '第二篇文章',
    })
    const before = await listArticleDrafts()
    const second = before.filter((item) => item.categoryId === 'category-1')[1]
    expect(second).toBeTruthy()

    expect(await moveArticleDraft(second!.id, -1)).toBe(true)
    const after = await listArticleDrafts()
    expect(after.filter((item) => item.categoryId === 'category-1')[0]?.id).toBe(
      second!.id,
    )
  })

  it('allows only one of two concurrent saves at the same revision', async () => {
    const original = await getArticleDraft('article-1')
    const baseInput = {
      categoryId: 'category-1',
      contentJson: { type: 'doc' as const, content: [] },
      plainText: '并发保存',
      expectedRevision: original!.revision,
    }
    const results = await Promise.all([
      saveArticleDraft('article-1', {
        ...baseInput,
        title: '编辑者甲',
        markdown: '编辑者甲的内容',
      }),
      saveArticleDraft('article-1', {
        ...baseInput,
        title: '编辑者乙',
        markdown: '编辑者乙的内容',
      }),
    ])

    expect(results.sort()).toEqual(['conflict', 'saved'])
    const current = await getArticleDraft('article-1')
    expect(current?.revision).toBe(original!.revision + 1)
    expect(['编辑者甲的内容', '编辑者乙的内容']).toContain(current?.markdown)
  })
})
