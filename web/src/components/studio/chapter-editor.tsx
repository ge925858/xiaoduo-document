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

interface ConflictSnapshot {
  currentTitle: string
  currentMarkdown: string
  currentContentJson: string | null
  currentCategoryId: string
  currentRevision: number
  localTitle: string
  localMarkdown: string
  localCategoryId: string
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
  const [conflict, setConflict] = useState<ConflictSnapshot | null>(null)
  const titleRef = useRef(title)
  const categoryRef = useRef(categoryId)
  const revisionRef = useRef(article.revision)
  const dirtyRef = useRef(false)
  const savingRef = useRef(false)
  const conflictRef = useRef(false)
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
    if (conflictRef.current) return
    dirtyRef.current = true
    setSaveState('dirty')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => void save(), 800)
  }

  async function save() {
    if (!editor || savingRef.current || conflictRef.current) return
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
    const payload = (await response.json()) as {
      result?: string
      current?: {
        title: string
        markdown: string
        contentJson: string | null
        categoryId: string
        revision: number
      }
    }
    savingRef.current = false
    if (response.status === 409) {
      if (timerRef.current) clearTimeout(timerRef.current)
      conflictRef.current = true
      setConflict({
        currentTitle: payload.current?.title ?? '',
        currentMarkdown: payload.current?.markdown ?? '',
        currentContentJson: payload.current?.contentJson ?? null,
        currentCategoryId: payload.current?.categoryId ?? article.categoryId,
        currentRevision: payload.current?.revision ?? revisionRef.current,
        localTitle: titleRef.current,
        localMarkdown: editor.getMarkdown(),
        localCategoryId: categoryRef.current,
      })
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

  function adoptSavedDraft() {
    if (!editor || !conflict) return
    const content = conflict.currentContentJson
      ? (JSON.parse(conflict.currentContentJson) as JSONContent)
      : conflict.currentMarkdown
    editor.commands.setContent(content, { emitUpdate: false })
    titleRef.current = conflict.currentTitle
    categoryRef.current = conflict.currentCategoryId
    revisionRef.current = conflict.currentRevision
    conflictRef.current = false
    dirtyRef.current = false
    setTitle(conflict.currentTitle)
    setCategoryId(conflict.currentCategoryId)
    setConflict(null)
    setSaveState('idle')
  }

  function keepLocalDraft() {
    if (!conflict) return
    revisionRef.current = conflict.currentRevision
    categoryRef.current = conflict.localCategoryId
    conflictRef.current = false
    setConflict(null)
    setSaveState('dirty')
    void save()
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

  async function withdraw() {
    setSaveState('saving')
    const response = await fetch(`/api/studio/articles/${article.id}/withdraw`, {
      method: 'POST',
    })
    if (!response.ok) {
      setSaveState('error')
      return
    }
    setPublicationState('unpublished')
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
      {conflict ? (
        <section className="draft-conflict" aria-labelledby="conflict-title">
          <div>
            <p className="eyebrow">Revision conflict</p>
            <h2 id="conflict-title">协作者冲突</h2>
            <p>当前草稿已被其他编辑者更新。请明确选择保留哪份内容。</p>
          </div>
          <div className="conflict-compare">
            <article>
              <h3>已保存版本</h3>
              <p>{conflict.currentTitle}</p>
              <pre>{conflict.currentMarkdown}</pre>
            </article>
            <article>
              <h3>我的未保存编辑</h3>
              <p>{conflict.localTitle}</p>
              <pre>{conflict.localMarkdown}</pre>
            </article>
          </div>
          <div className="conflict-actions">
            <button type="button" onClick={adoptSavedDraft}>
              采用已保存版本
            </button>
            <button type="button" onClick={keepLocalDraft}>
              保留我的编辑并覆盖
            </button>
          </div>
        </section>
      ) : null}
      <div className="editor-workspace">
        <div>
          <div className="editor-actions">
            <button type="button" onClick={() => void save()}>
              保存草稿
            </button>
            <button type="button" onClick={() => void publish()}>
              {publicationState === 'published' ? '更新发布' : '发布章节'}
            </button>
            {publicationState === 'published' ? (
              <button type="button" onClick={() => void withdraw()}>
                撤回发布
              </button>
            ) : null}
            <span>{article.path}</span>
          </div>
        </div>
        <VersionHistory articleId={article.id} versions={versions} />
      </div>
    </section>
  )
}
