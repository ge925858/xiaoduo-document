'use client'

import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import type { JSONContent } from '@tiptap/core'
import { useRouter } from 'next/navigation'
import {
  VersionHistory,
  type VersionItem,
} from './version-history'

interface CategoryItem {
  id: string
  title: string
}

interface ArticleItem {
  id: string
  title: string
  categoryId: string
  path: string
  contentJson: string | null
  markdown: string
  revision: number
  publicationState: 'draft' | 'published' | 'unpublished'
}

type SaveState =
  | 'idle'
  | 'dirty'
  | 'saving'
  | 'saved'
  | 'conflict'
  | 'error'

function initialContent(article: ArticleItem): JSONContent | string {
  if (article.contentJson) {
    try {
      return JSON.parse(article.contentJson) as JSONContent
    } catch {
      return article.markdown
    }
  }
  return article.markdown
}

export function ChapterEditor({
  article,
  categories,
  versions,
}: {
  article: ArticleItem
  categories: CategoryItem[]
  versions: VersionItem[]
}) {
  const router = useRouter()
  const [title, setTitle] = useState(article.title)
  const [categoryId, setCategoryId] = useState(article.categoryId)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [publicationState, setPublicationState] = useState(
    article.publicationState,
  )
  const titleRef = useRef(title)
  const categoryRef = useRef(categoryId)
  const revisionRef = useRef(article.revision)
  const dirtyRef = useRef(false)
  const savingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: initialContent(article),
    contentType: article.contentJson ? 'json' : 'markdown',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'chapter-editor-content',
        'aria-label': '章节正文',
      },
    },
  })

  function markDirty() {
    dirtyRef.current = true
    setSaveState('dirty')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => void save(), 800)
  }

  async function save() {
    if (!editor || savingRef.current) return
    savingRef.current = true
    setSaveState('saving')
    const response = await fetch(`/api/studio/articles/${article.id}/draft`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: titleRef.current,
        categoryId: categoryRef.current,
        contentJson: editor.getJSON(),
        markdown: editor.getMarkdown(),
        plainText: editor.getText(),
        expectedRevision: revisionRef.current,
      }),
    })
    const payload = (await response.json()) as { result?: string }
    savingRef.current = false
    if (response.status === 409) {
      setSaveState('conflict')
      return
    }
    if (!response.ok || payload.result !== 'saved') {
      setSaveState('error')
      return
    }
    revisionRef.current += 1
    dirtyRef.current = false
    setSaveState('saved')
    router.refresh()
  }

  useEffect(() => {
    if (!editor) return
    const onUpdate = () => markDirty()
    editor.on('update', onUpdate)
    return () => {
      editor.off('update', onUpdate)
    }
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void save()
      }
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current && saveState !== 'error') return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  })

  const labels: Record<SaveState, string> = {
    idle: '尚未修改',
    dirty: '等待自动保存',
    saving: '正在保存…',
    saved: '草稿已保存',
    conflict: '其他编辑者已保存，请对比后再继续。',
    error: '保存失败，请重试。',
  }

  async function publish() {
    setSaveState('saving')
    const response = await fetch(`/api/studio/articles/${article.id}/publish`, {
      method: 'POST',
    })
    if (!response.ok) {
      setSaveState('error')
      return
    }
    setPublicationState('published')
    setSaveState('saved')
    router.refresh()
  }

  return (
    <section className="chapter-editor">
      <div className="editor-topbar">
        <p className="eyebrow">Chapter draft</p>
        <p role="status" data-save-state={saveState}>
          {labels[saveState]}
        </p>
      </div>
      <label className="editor-title">
        章节标题
        <input
          value={title}
          onChange={(event) => {
            titleRef.current = event.target.value
            setTitle(event.target.value)
            markDirty()
          }}
        />
      </label>
      <label className="editor-category">
        所属分类
        <select
          value={categoryId}
          onChange={(event) => {
            categoryRef.current = event.target.value
            setCategoryId(event.target.value)
            markDirty()
          }}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.title}
            </option>
          ))}
        </select>
      </label>
      <div className="editor-surface">
        <EditorContent editor={editor} />
      </div>
      <div className="editor-workspace">
        <div>
          <div className="editor-actions">
            <button type="button" onClick={() => void save()}>
              保存草稿
            </button>
            <button type="button" onClick={() => void publish()}>
              {publicationState === 'published' ? '更新发布' : '发布章节'}
            </button>
            <span>{article.path}</span>
          </div>
        </div>
        <VersionHistory articleId={article.id} versions={versions} />
      </div>
    </section>
  )
}
