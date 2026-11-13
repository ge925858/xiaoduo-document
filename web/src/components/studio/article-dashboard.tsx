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
}: {
  categories: CategoryItem[]
  articles: ArticleItem[]
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

  async function move(id: string, direction: -1 | 1) {
    await fetch(`/api/studio/articles/${id}/move`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ direction }),
    })
    router.refresh()
  }

  return (
    <div className="article-dashboard">
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
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
