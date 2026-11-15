'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowDown,
  ArrowUp,
  FilePlus2,
  FileText,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog } from '@/components/ui/dialog'
import { StudioSelect } from '@/components/ui/studio-select'
import { formatRelativeTime } from '@/lib/format-time'

interface CategoryItem {
  id: string
  title: string
}

interface ArticleItem {
  id: string
  title: string
  categoryId: string
  categoryTitle: string
  plainText: string
  publicationState: 'draft' | 'published' | 'unpublished'
  revision: number
  updatedAt: string
  pendingUpdate: boolean
}

type Filter = 'all' | 'draft' | 'published'

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
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [newCategoryId, setNewCategoryId] = useState(
    categories[0]?.id ?? '',
  )
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importCategoryId, setImportCategoryId] = useState(
    categories[0]?.id ?? '',
  )
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [trashTarget, setTrashTarget] = useState<ArticleItem | null>(
    null,
  )

  useEffect(() => {
    const theme = window.localStorage.getItem('zhijian-theme')
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.dataset.theme = theme
      document.documentElement.style.colorScheme = theme
    }
  }, [])

  const normalizedQuery = query.trim().toLowerCase()
  const visible = articles
    .filter(
      (article) =>
        categoryFilter === 'all' ||
        article.categoryId === categoryFilter,
    )
    .filter((article) => {
      if (filter === 'published') {
        return article.publicationState === 'published'
      }
      if (filter === 'draft') {
        return article.publicationState !== 'published'
      }
      return true
    })
    .filter(
      (article) =>
        !normalizedQuery ||
        article.title.toLowerCase().includes(normalizedQuery) ||
        article.plainText.toLowerCase().includes(normalizedQuery) ||
        article.categoryTitle.toLowerCase().includes(normalizedQuery),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  const publishedCount = articles.filter(
    (article) => article.publicationState === 'published',
  ).length
  const draftCount = articles.length - publishedCount
  const latest = articles
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]

  function clearFilters() {
    setFilter('all')
    setQuery('')
    setCategoryFilter('all')
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newCategoryId) return
    setMessage('')
    setPending(true)
    try {
      const response = await fetch('/api/studio/articles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          categoryId: newCategoryId,
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
      setCreateOpen(false)
      router.push(`/studio/notes/${payload.article.id}`)
    } catch {
      setMessage('创建章节失败，请重试。')
    } finally {
      setPending(false)
    }
  }

  async function importMarkdown(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setPending(true)
    const data = new FormData(event.currentTarget)
    data.set('categoryId', importCategoryId)
    try {
      const response = await fetch('/api/studio/articles/import', {
        method: 'POST',
        body: data,
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
    } catch {
      setMessage('导入失败，请重试。')
    } finally {
      setPending(false)
    }
  }

  async function move(id: string, direction: -1 | 1) {
    await fetch(`/api/studio/articles/${id}/move`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ direction }),
    })
    router.refresh()
  }

  async function trash(article: ArticleItem) {
    setPending(true)
    await fetch(`/api/studio/articles/${article.id}/trash`, {
      method: 'POST',
    })
    setPending(false)
    setTrashTarget(null)
    router.refresh()
  }

  return (
    <div className="studio-page">
      <header className="studio-page-header">
        <div>
          <p className="section-kicker">Content</p>
          <h1>写作台</h1>
          <p>
            {canManage
              ? '草稿与公开章节都在这里。读者只会看到最近一次发布版本。'
              : '这里只展示你获得授权编辑的文章，其他内容不可见。'}
          </p>
        </div>
        {canManage ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="studio-secondary-button"
              onClick={() => {
                setMessage('')
                setImportOpen(true)
              }}
            >
              <Upload size={18} />
              导入 Markdown
            </button>
            <button
              type="button"
              className="studio-primary-button"
              onClick={() => {
                setMessage('')
                setCreateOpen(true)
              }}
              disabled={!newCategoryId || pending}
            >
              <FilePlus2 size={19} />
              新建章节
            </button>
          </div>
        ) : null}
      </header>

      {message && !importOpen && !createOpen ? (
        <p role="alert">{message}</p>
      ) : null}

      <div className="studio-stats">
        <div>
          <span>全部章节</span>
          <strong>{articles.length}</strong>
        </div>
        <div>
          <span>公开</span>
          <strong>{publishedCount}</strong>
        </div>
        <div>
          <span>草稿</span>
          <strong>{draftCount}</strong>
        </div>
        <div data-visual-dynamic>
          <span>最近整理</span>
          <strong className="studio-stat-relative">
            {latest ? formatRelativeTime(latest.updatedAt) : '—'}
          </strong>
        </div>
      </div>

      <div className="studio-toolbar">
        <div className="segmented-control">
          {(
            [
              ['all', '全部'],
              ['draft', '草稿'],
              ['published', '已发布'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? 'is-active' : ''}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <StudioSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: 'all', label: '全部分类' },
              ...categories.map((category) => ({
                value: category.id,
                label: category.title,
              })),
            ]}
            ariaLabel="按分类筛选"
          />
          <label className="studio-search">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索章节"
            />
          </label>
        </div>
      </div>

      <div className="studio-note-table">
        <div className="studio-table-head" aria-hidden="true">
          <span>章节</span>
          <span>分类</span>
          <span>状态</span>
          <span>最后保存</span>
        </div>
        {visible.map((article) => (
          <div
            key={article.id}
            className="studio-table-row"
          >
            <Link
              href={`/studio/notes/${article.id}`}
              className="studio-row-main"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <FileText
                    size={18}
                    className="shrink-0 text-[var(--muted-faint)]"
                  />
                  <span className="truncate text-[16px] font-medium text-[var(--ink)]">
                    {article.title}
                  </span>
                </span>
                <span className="mt-1 block truncate pl-6 text-[13px] text-[var(--muted)]">
                  {article.plainText || '还没有正文内容'}
                </span>
              </span>
            </Link>
            <span className="truncate text-[14px] text-[var(--muted)]">
              {article.categoryTitle}
            </span>
            <span>
              <span
                className={`studio-status ${
                  article.publicationState === 'published'
                    ? 'is-public'
                    : ''
                }`}
              >
                {article.pendingUpdate
                  ? '待更新'
                  : article.publicationState === 'published'
                    ? '已发布'
                    : article.publicationState === 'unpublished'
                      ? '已撤回'
                      : '草稿'}
              </span>
            </span>
            <span
              className="text-[13px] text-[var(--muted-faint)]"
              data-visual-dynamic
            >
              {formatRelativeTime(article.updatedAt)}
            </span>
            <span className="studio-row-actions">
              {canManage ? (
                <button
                  type="button"
                  aria-label={`上移 ${article.title}`}
                  onClick={(event) => {
                    event.preventDefault()
                    void move(article.id, -1)
                  }}
                >
                  <ArrowUp size={17} />
                </button>
              ) : null}
              {canManage ? (
                <button
                  type="button"
                  aria-label={`下移 ${article.title}`}
                  onClick={(event) => {
                    event.preventDefault()
                    void move(article.id, 1)
                  }}
                >
                  <ArrowDown size={17} />
                </button>
              ) : null}
              <button
                type="button"
                aria-label={`移入回收站 ${article.title}`}
                onClick={(event) => {
                  event.preventDefault()
                  setTrashTarget(article)
                }}
              >
                <Trash2 size={17} />
              </button>
            </span>
          </div>
        ))}
        {!visible.length ? (
          <div className="studio-empty-state">
            <p>没有匹配的章节</p>
            <span>换一个筛选条件，或者重置后查看全部内容。</span>
            <button type="button" onClick={clearFilters}>
              清除筛选
            </button>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(trashTarget)}
        onOpenChange={(open) => {
          if (!open) setTrashTarget(null)
        }}
        title="将章节移入回收站？"
        description={
          trashTarget
            ? `章节“${trashTarget.title}”会从内容列表移除，并在回收站保留 30 天。`
            : ''
        }
        confirmLabel="移入回收站"
        pending={pending}
        onConfirm={() => {
          if (trashTarget) void trash(trashTarget)
        }}
      />

      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="新建章节"
        description="确认后会创建一篇无标题章节草稿，并立即进入编辑器。"
      >
        <form className="p-5" onSubmit={create}>
          <label className="text-xs font-medium text-[var(--ink-soft)]">
            所属分类
            <StudioSelect
              value={newCategoryId}
              onChange={setNewCategoryId}
              options={categories.map((category) => ({
                value: category.id,
                label: category.title,
              }))}
              ariaLabel="新建章节所属分类"
              className="mt-2 w-full"
            />
          </label>
          {message ? (
            <p className="mt-3 text-xs text-[var(--rust)]" role="alert">
              {message}
            </p>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              className="studio-secondary-button"
              onClick={() => setCreateOpen(false)}
            >
              取消
            </button>
            <button
              type="submit"
              className="studio-primary-button"
              disabled={pending || !newCategoryId}
            >
              <FilePlus2 size={18} />
              {pending ? '正在创建…' : '创建草稿'}
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="导入 Markdown"
        description="导入会创建新的章节草稿，不会覆盖现有内容。"
      >
        <form className="studio-import-dialog" onSubmit={importMarkdown}>
          <label>
            <span>导入分类</span>
            <StudioSelect
              value={importCategoryId}
              onChange={setImportCategoryId}
              options={categories.map((category) => ({
                value: category.id,
                label: category.title,
              }))}
              ariaLabel="导入分类"
            />
          </label>
          <label>
            <span>Markdown 文件</span>
            <input
              name="file"
              type="file"
              accept=".md,.markdown"
              required
            />
          </label>
          {message ? <p role="alert">{message}</p> : null}
          <div>
            <button
              type="button"
              className="studio-secondary-button"
              onClick={() => setImportOpen(false)}
            >
              取消
            </button>
            <button
              type="submit"
              className="studio-primary-button"
              disabled={pending || !importCategoryId}
            >
              <Upload size={18} />
              {pending ? '正在导入…' : '导入为草稿'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
