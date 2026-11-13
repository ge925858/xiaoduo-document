'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CategoryItem {
  id: string
  title: string
}

interface ArticleItem {
  id: string
  title: string
  categoryId: string
  categoryTitle: string
  publicationState: string
  revision: number
  updatedAt: string
}

export function ArticleDashboard({
  categories,
  articles,
  canManage,
}: {
  categories: CategoryItem[]
  articles: ArticleItem[]
  canManage: boolean
}) {
  const router = useRouter()
  const [message, setMessage] = useState('')

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    const data = new FormData(event.currentTarget)
    const response = await fetch('/api/studio/articles', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        categoryId: String(data.get('categoryId') ?? ''),
        title: '无标题章节',
      }),
    })
    const payload = (await response.json()) as {
      article?: { id: string }
      error?: string
    }
    if (!response.ok || !payload.article) {
      setMessage(
        payload.error === 'CATEGORY_NOT_FOUND'
          ? '请先创建分类。'
          : '创建章节失败，请重试。',
      )
      return
    }
    router.push(`/studio/notes/${payload.article.id}`)
  }

  async function importFile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    const response = await fetch('/api/studio/articles/import', {
      method: 'POST',
      body: new FormData(event.currentTarget),
    })
    const payload = (await response.json()) as {
      article?: { id: string }
      error?: string
    }
    if (!response.ok || !payload.article) {
      const errors: Record<string, string> = {
        EMPTY_MARKDOWN: 'Markdown 文件内容为空。',
        UNSUPPORTED_FILE: '请选择 .md 或 .markdown 文件。',
        MARKDOWN_TOO_LARGE: 'Markdown 文件超过 2 MB。',
      }
      setMessage(errors[payload.error ?? ''] ?? '导入失败，请重试。')
      return
    }
    router.push(`/studio/notes/${payload.article.id}`)
  }

  async function move(id: string, direction: -1 | 1) {
    await fetch(`/api/studio/articles/${id}/move`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ direction }),
    })
    router.refresh()
  }

  async function trash(id: string) {
    await fetch(`/api/studio/articles/${id}/trash`, { method: 'POST' })
    router.refresh()
  }

  return (
    <div className="article-dashboard">
      {canManage ? (
        <>
          <form className="studio-form create-article-form" onSubmit={create}>
            <label>
              所属分类
              <select name="categoryId" required>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={!categories.length}>
              新建章节
            </button>
          </form>
          <form className="studio-form import-form" onSubmit={importFile}>
            <label>
              导入分类
              <select name="categoryId" required>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Markdown 文件
              <input name="file" type="file" accept=".md,.markdown" required />
            </label>
            <button type="submit" disabled={!categories.length}>
              导入为草稿
            </button>
          </form>
        </>
      ) : null}
      {message ? <p role="alert">{message}</p> : null}

      <div className="studio-article-list">
        {articles.map((article) => (
          <article key={article.id}>
            <div>
              <p>
                {article.categoryTitle} · {article.publicationState}
              </p>
              <h2>
                <Link href={`/studio/notes/${article.id}`}>
                  {article.title}
                </Link>
              </h2>
              <span>修订 {article.revision}</span>
            </div>
            {canManage ? (
              <div className="category-actions">
                <button
                  type="button"
                  aria-label={`上移 ${article.title}`}
                  onClick={() => move(article.id, -1)}
                >
                  上移
                </button>
                <button
                  type="button"
                  aria-label={`下移 ${article.title}`}
                  onClick={() => move(article.id, 1)}
                >
                  下移
                </button>
                <button
                  type="button"
                  aria-label={`移入回收站 ${article.title}`}
                  onClick={() => void trash(article.id)}
                >
                  移入回收站
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  )
}
