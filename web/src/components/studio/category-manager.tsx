'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CategoryItem {
  id: string
  title: string
  slug: string
  position: number
}

export function CategoryManager({
  initialCategories,
}: {
  initialCategories: CategoryItem[]
}) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function request(url: string, init: RequestInit) {
    setPending(true)
    setMessage('')
    const response = await fetch(url, init)
    const payload = (await response.json()) as { error?: string }
    setPending(false)
    if (!response.ok) {
      const errors: Record<string, string> = {
        SLUG_TAKEN: '分类网址标识已存在。',
        CATEGORY_NOT_EMPTY: '分类中仍有章节，不能删除。',
        CANNOT_MOVE: '该分类已经位于边界。',
        INVALID_CATEGORY: '请填写有效的中文名称和英文网址标识。',
      }
      setMessage(errors[payload.error ?? ''] ?? '操作失败，请重试。')
      return false
    }
    router.refresh()
    return true
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const created = await request('/api/studio/categories', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: String(data.get('title') ?? ''),
        slug: String(data.get('slug') ?? ''),
      }),
    })
    if (created) form.reset()
  }

  async function save(
    item: CategoryItem,
    values: { title: string; slug: string },
  ) {
    await request(`/api/studio/categories/${item.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: values.title,
        slug: values.slug,
      }),
    })
  }

  async function remove(item: CategoryItem) {
    await request(`/api/studio/categories/${item.id}`, {
      method: 'DELETE',
    })
  }

  async function move(item: CategoryItem, direction: -1 | 1) {
    await request(`/api/studio/categories/${item.id}/move`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ direction }),
    })
  }

  return (
    <div className="category-manager">
      <form className="studio-form inline-create" onSubmit={create}>
        <label>
          新分类名称
          <input name="title" required maxLength={200} />
        </label>
        <label>
          新分类网址标识
          <input name="slug" required pattern="[a-z0-9-]+" />
        </label>
        <button type="submit" disabled={pending}>
          创建分类
        </button>
      </form>

      {message ? <p role="alert">{message}</p> : null}

      <ol className="category-list">
        {initialCategories.map((category, index) => (
          <CategoryRow
            key={`${category.id}:${category.position}:${category.title}:${category.slug}`}
            category={category}
            disabled={pending}
            canMoveUp={index > 0}
            canMoveDown={index < initialCategories.length - 1}
            onSave={save}
            onRemove={remove}
            onMove={move}
          />
        ))}
      </ol>
    </div>
  )
}

function CategoryRow({
  category,
  disabled,
  canMoveUp,
  canMoveDown,
  onSave,
  onRemove,
  onMove,
}: {
  category: CategoryItem
  disabled: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onSave: (
    category: CategoryItem,
    values: { title: string; slug: string },
  ) => Promise<void>
  onRemove: (category: CategoryItem) => Promise<void>
  onMove: (category: CategoryItem, direction: -1 | 1) => Promise<void>
}) {
  return (
    <li>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          void onSave(category, {
            title: String(data.get('title') ?? ''),
            slug: String(data.get('slug') ?? ''),
          })
        }}
      >
        <div className="category-fields">
          <label>
            分类名称
            <input
              name="title"
              aria-label={`分类名称 ${category.title}`}
              defaultValue={category.title}
            />
          </label>
          <label>
            分类网址标识
            <input
              name="slug"
              aria-label={`分类网址标识 ${category.title}`}
              defaultValue={category.slug}
            />
          </label>
        </div>
        <div className="category-actions">
          <button type="submit" disabled={disabled}>
            保存分类
          </button>
          <button
            type="button"
            aria-label={`上移 ${category.title}`}
            disabled={disabled || !canMoveUp}
            onClick={() => onMove(category, -1)}
          >
            上移
          </button>
          <button
            type="button"
            aria-label={`下移 ${category.title}`}
            disabled={disabled || !canMoveDown}
            onClick={() => onMove(category, 1)}
          >
            下移
          </button>
          <button
            type="button"
            aria-label={`删除 ${category.title}`}
            disabled={disabled}
            onClick={() => onRemove(category)}
          >
            删除
          </button>
        </div>
      </form>
    </li>
  )
}
