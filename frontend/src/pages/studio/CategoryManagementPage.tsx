import { useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, FolderPlus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePageTitle } from '../../lib/usePageTitle'
import { useSiteStore } from '../../store/siteStore'
import type { Category } from '../../types'

export function CategoryManagementPage() {
  usePageTitle('分类管理 · 知笺')
  const categories = useSiteStore((state) => state.categories)
  const notes = useSiteStore((state) => state.notes)
  const createCategory = useSiteStore((state) => state.createCategory)
  const updateCategory = useSiteStore((state) => state.updateCategory)
  const deleteCategory = useSiteStore((state) => state.deleteCategory)
  const moveCategory = useSiteStore((state) => state.moveCategory)
  const [newTitle, setNewTitle] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const ordered = categories.slice().sort((a, b) => a.order - b.order)

  const create = (event: FormEvent) => {
    event.preventDefault()
    const id = createCategory(newTitle, newSlug)
    if (!id) {
      toast.error('请填写分类名称和唯一的英文网址标识')
      return
    }
    setNewTitle('')
    setNewSlug('')
    toast.success('分类已创建')
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

      <form onSubmit={create} className="category-create-form">
        <FolderPlus size={20} />
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="分类名称"
          aria-label="分类名称"
        />
        <input
          value={newSlug}
          onChange={(event) => setNewSlug(event.target.value)}
          placeholder="english-slug"
          aria-label="分类英文网址标识"
          className="max-w-[210px]"
        />
        <button type="submit" className="studio-primary-button">
          新建分类
        </button>
      </form>

      <div className="category-editor-list">
        {ordered.map((category, index) => (
          <CategoryEditor
            key={category.id}
            category={category}
            index={index}
            chapterCount={
              notes.filter(
                (note) =>
                  note.categoryId === category.id ||
                  note.published?.categoryId === category.id,
              ).length
            }
            canMoveUp={index > 0}
            canMoveDown={index < ordered.length - 1}
            onMoveUp={() => moveCategory(category.id, -1)}
            onMoveDown={() => moveCategory(category.id, 1)}
            onSave={(patch) => {
              if (!updateCategory(category.id, patch)) {
                toast.error('分类网址标识重复或无效')
                return
              }
              toast.success('分类已保存')
            }}
            onDelete={() => {
              if (!deleteCategory(category.id)) {
                toast.error('分类中还有章节，不能删除')
                return
              }
              toast.success('分类已删除')
            }}
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
  onMoveUp,
  onMoveDown,
  onSave,
  onDelete,
}: {
  category: Category
  index: number
  chapterCount: number
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onSave: (patch: { title: string; slug: string }) => void
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
            disabled={!canMoveUp}
            onClick={onMoveUp}
            className="studio-icon-button"
            aria-label="上移分类"
          >
            <ArrowUp size={18} />
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            className="studio-icon-button"
            aria-label="下移分类"
          >
            <ArrowDown size={18} />
          </button>
        </div>
      </header>
      <div className="category-editor-fields sm:grid-cols-2">
        <label>
          <span>名称</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label>
          <span>英文网址标识</span>
          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          />
        </label>
      </div>
      <div className="flex items-center justify-between border-t border-[var(--line)] pt-4">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--rust)] disabled:opacity-40"
          onClick={onDelete}
          disabled={chapterCount > 0}
        >
          <Trash2 size={16} />
          删除分类
        </button>
        <button
          type="button"
          className="studio-primary-button"
          onClick={() => onSave({ title, slug })}
        >
          <Save size={18} />
          保存
        </button>
      </div>
    </section>
  )
}
