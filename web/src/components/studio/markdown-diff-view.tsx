'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  blockTypeLabel,
  buildInlineMarkdownDiff,
  buildMarkdownDiff,
  changeLabel,
  summarizeMarkdownDiff,
  type MarkdownDiffBlock,
  type MarkdownDiffChange,
} from '@/lib/markdown-diff'

function BlockContent({
  block,
  counterpart,
  kind,
}: {
  block: MarkdownDiffBlock
  counterpart: MarkdownDiffBlock | null
  kind: MarkdownDiffChange['kind'] | 'equal'
}) {
  if (kind === 'modified' && counterpart) {
    return (
      <>
        {buildInlineMarkdownDiff(counterpart.text, block.text).map(
          (part, index) => (
            <span
              key={`${index}-${part.kind}`}
              className={`inline-diff inline-diff-${part.kind}`}
            >
              {part.text}
            </span>
          ),
        )}
      </>
    )
  }
  return block.text
}

export function MarkdownDiffView({
  title,
  oldMarkdown,
  newMarkdown,
  mode,
  onNavigate,
  onClose,
}: {
  title: string
  oldMarkdown: string
  newMarkdown: string
  mode: 'version' | 'draft'
  onNavigate?: (change: MarkdownDiffChange) => void
  onClose: () => void
}) {
  const diff = useMemo(
    () => buildMarkdownDiff(oldMarkdown, newMarkdown),
    [oldMarkdown, newMarkdown],
  )
  const summary = summarizeMarkdownDiff(diff)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [listOpen, setListOpen] = useState(false)
  const containerRef = useRef<HTMLElement>(null)
  const activeChange =
    activeIndex >= 0 ? (diff.changes[activeIndex] ?? null) : null

  useEffect(() => {
    if (!activeChange || !containerRef.current) return
    const target = containerRef.current.querySelector(
      `[data-active-diff="${activeChange.id}"]`,
    )
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (mode === 'draft') onNavigate?.(activeChange)
  }, [activeChange, mode, onNavigate])

  function move(offset: number) {
    if (!diff.changes.length) return
    const current = activeIndex < 0 ? (offset > 0 ? -1 : 0) : activeIndex
    setActiveIndex(
      (current + offset + diff.changes.length) % diff.changes.length,
    )
  }

  function blockChange(index: number, side: 'old' | 'new') {
    const id =
      side === 'old' ? diff.oldChangeIds[index] : diff.newChangeIds[index]
    return id ? diff.changes.find((change) => change.id === id) : null
  }

  function renderColumn(blocks: MarkdownDiffBlock[], side: 'old' | 'new') {
    return blocks.map((block) => {
      const change = blockChange(block.index, side)
      const isActive = change?.id === activeChange?.id
      const kind = change?.kind ?? 'equal'
      const counterpart =
        side === 'old' ? (change?.after ?? null) : (change?.before ?? null)
      return (
        <article
          key={`${side}-${block.index}`}
          className={`markdown-diff-block diff-${kind}${isActive ? ' is-active' : ''}`}
          data-active-diff={isActive ? change?.id : undefined}
        >
          <span>{blockTypeLabel(block.kind)}</span>
          <pre>
            <BlockContent
              block={block}
              counterpart={counterpart}
              kind={kind}
            />
          </pre>
        </article>
      )
    })
  }

  return (
    <section className="markdown-diff-view" ref={containerRef}>
      <div className="markdown-diff-header">
        <div>
          <p className="eyebrow">{title}</p>
          <h2>版本差异</h2>
        </div>
        <button type="button" onClick={onClose}>
          关闭对照
        </button>
      </div>
      <div className="markdown-diff-summary">
        <strong>共 {summary.total} 处变化</strong>
        <span>
          新增 {summary.added} · 删除 {summary.removed} · 修改{' '}
          {summary.modified}
        </span>
        <div className="markdown-diff-arrows">
          <button
            type="button"
            disabled={!summary.total}
            onClick={() => move(-1)}
          >
            上一处
          </button>
          <span>
            {activeIndex >= 0 ? activeIndex + 1 : 0}/{summary.total}
          </span>
          <button
            type="button"
            disabled={!summary.total}
            onClick={() => move(1)}
          >
            下一处
          </button>
          <button
            type="button"
            aria-expanded={listOpen}
            onClick={() => setListOpen((open) => !open)}
          >
            变更列表
          </button>
        </div>
      </div>
      {listOpen ? (
        <ol className="markdown-diff-change-list" aria-label="变更列表">
          {diff.changes.map((change, index) => (
            <li key={change.id}>
              <button
                type="button"
                className={index === activeIndex ? 'is-active' : ''}
                onClick={() => setActiveIndex(index)}
              >
                <span>{changeLabel(change)}</span>
                <strong>{change.heading}</strong>
                <small>
                  {change.after?.text ||
                    change.before?.text ||
                    change.after?.markdown ||
                    change.before?.markdown}
                </small>
              </button>
            </li>
          ))}
        </ol>
      ) : null}
      {summary.total ? (
        <div className="markdown-diff-columns">
          <section aria-label="对照左侧">
            <h3>原版本</h3>
            {renderColumn(diff.oldBlocks, 'old')}
          </section>
          <section aria-label="对照右侧">
            <h3>{mode === 'draft' ? '当前草稿' : '新版本'}</h3>
            {renderColumn(diff.newBlocks, 'new')}
          </section>
        </div>
      ) : (
        <p>这两份 Markdown 没有内容差异。</p>
      )}
    </section>
  )
}
