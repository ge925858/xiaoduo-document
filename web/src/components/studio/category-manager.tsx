'use client'

import { ArrowDown, ArrowUp, FolderPlus, Save, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface CategoryItem {
  id: string
  title: string
  slug: string
  position: number
}

export function CategoryManager({
  initialCategories,
  chapterCounts,
}: {
  initialCategories: CategoryItem[]
  chapterCounts: Record<string, number>
}) {
  const router = useRouter()
  const [newTitle, setNewTitle] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const ordered = [...initialCategories].sort(
    (left, right) => left.position - right.position,
  )

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
    const created = await request('/api/studio/categories', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: newTitle, slug: newSlug }),
    })
    if (created) {
      setNewTitle('')
      setNewSlug('')
    }
  }

  async function save(
    category: CategoryItem,
    values: { title: string; slug: string },
  ) {
    await request(`/api/studio/categories/${category.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(values),
    })
  }

  async function remove(category: CategoryItem) {
    await request(`/api/studio/categories/${category.id}`, {
      method: 'DELETE',
    })
  }

  async function move(category: CategoryItem, direction: -1 | 1) {
    await request(`/api/studio/categories/${category.id}/move`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ direction }),
    })
  }

  return (
    <div className="studio-page max-w-[900px]">
      <header className="studio-page-header">
        <div>
          <p className="section-kicker">Library structure</p>
          <h1>分类</h1>
          <p>分类只负责组织章节。名称用于界面展示，英文标识进入公开网址。</p>
        </div>
      </header>

      <form className="category-create-form" onSubmit={create}>
        <FolderPlus size={16} />
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="分类名称"
          aria-label="分类名称"
          required
        />
        <input
          value={newSlug}
          onChange={(event) => setNewSlug(event.target.value)}
          placeholder="english-slug"
          aria-label="分类英文网址标识"
          pattern="[a-z0-9-]+"
          required
        />
        <button
          type="submit"
          className="studio-primary-button"
          disabled={pending}
        >
          新建分类
        </button>
      </form>

      {message ? (
        <p className="category-form-error" role="alert">
          {message}
        </p>
      ) : null}

      <div className="category-editor-list">
        {ordered.map((category, index) => (
          <CategoryEditor
            key={`${category.id}:${category.position}:${category.title}:${category.slug}`}
            category={category}
            index={index}
            chapterCount={chapterCounts[category.id] ?? 0}
            canMoveUp={index > 0}
            canMoveDown={index < ordered.length - 1}
            disabled={pending}
            onMoveUp={() => void move(category, -1)}
            onMoveDown={() => void move(category, 1)}
            onSave={(values) => void save(category, values)}
            onDelete={() => void remove(category)}
          />
        ))}
      </div>
    </div>
  )
}

function CategoryEditor({
  category,
  index,
  chapterCount,
  canMoveUp,
  canMoveDown,
  disabled,
  onMoveUp,
  onMoveDown,
  onSave,
  onDelete,
}: {
  category: CategoryItem
  index: number
  chapterCount: number
  canMoveUp: boolean
  canMoveDown: boolean
  disabled: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onSave: (values: { title: string; slug: string }) => void
  onDelete: () => void
}) {
  const [title, setTitle] = useState(category.title)
  const [slug, setSlug] = useState(category.slug)

  return (
    <section className="category-editor">
      <header>
        <span>{String(index + 1).padStart(2, '0')}</span>
        <div>
          <h2>{category.title}</h2>
          <p>{chapterCount} 篇章节</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            disabled={disabled || !canMoveUp}
            onClick={onMoveUp}
            className="studio-icon-button"
            aria-label={`上移 ${category.title}`}
            title="上移分类"
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            disabled={disabled || !canMoveDown}
            onClick={onMoveDown}
            className="studio-icon-button"
            aria-label={`下移 ${category.title}`}
            title="下移分类"
          >
            <ArrowDown size={14} />
          </button>
        </div>
      </header>
      <div className="category-editor-fields sm:grid-cols-2">
        <label>
          <span>名称</span>
          <input
            value={title}
            aria-label={`分类名称 ${category.title}`}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label>
          <span>英文网址标识</span>
          <input
            value={slug}
            aria-label={`分类网址标识 ${category.title}`}
            onChange={(event) => setSlug(event.target.value)}
          />
        </label>
      </div>
      <div className="flex items-center justify-between border-t border-[var(--line)] pt-4">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-[10px] text-[var(--rust)] disabled:opacity-40"
          aria-label={`删除 ${category.title}`}
          disabled={disabled || chapterCount > 0}
          title={
            chapterCount > 0 ? '分类中仍有章节，不能删除' : '删除空分类'
          }
          onClick={onDelete}
        >
          <Trash2 size={12} />
          删除分类
        </button>
        <button
          type="button"
          className="studio-primary-button"
          aria-label="保存分类"
          disabled={disabled}
          onClick={() => onSave({ title, slug })}
        >
          <Save size={14} />
          保存
        </button>
      </div>
    </section>
  )
}
