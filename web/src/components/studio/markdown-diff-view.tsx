'use client'

import { useMemo, useState } from 'react'
import {
  buildMarkdownDiff,
  type MarkdownDiffChange,
} from '@/lib/markdown-diff'
import {
  MarkdownDiffNavigator,
  MarkdownDiffPane,
} from './markdown-diff-navigator'

export function MarkdownDiffView({
  title,
  oldMarkdown,
  newMarkdown,
  mode,
  oldMeta,
  newMeta,
  onNavigate,
  onClose,
  showHeader = true,
}: {
  title: string
  oldMarkdown: string
  newMarkdown: string
  mode: 'version' | 'draft'
  oldMeta?: string
  newMeta?: string
  onNavigate?: (change: MarkdownDiffChange) => void
  onClose: () => void
  showHeader?: boolean
}) {
  const diff = useMemo(
    () => buildMarkdownDiff(oldMarkdown, newMarkdown),
    [oldMarkdown, newMarkdown],
  )
  const [activeChangeId, setActiveChangeId] = useState<string | null>(
    diff.changes[0]?.id ?? null,
  )
  const activeChange =
    diff.changes.find((change) => change.id === activeChangeId) ?? null

  function selectChange(change: MarkdownDiffChange) {
    setActiveChangeId(change.id)
    if (mode === 'draft') onNavigate?.(change)
  }

  return (
    <section className="version-diff-preview">
      {showHeader ? (
        <div className="markdown-diff-header">
          <div>
            <p className="eyebrow">{title}</p>
            <h2>版本差异</h2>
          </div>
          <button type="button" onClick={onClose}>
            关闭对照
          </button>
        </div>
      ) : null}
      <MarkdownDiffNavigator
        changes={diff.changes}
        activeChangeId={activeChange?.id ?? null}
        onSelect={selectChange}
      />
      <div className="version-diff-columns">
        <section>
          <header className="is-old">
            <span>上一版本</span>
            {oldMeta ? <small>{oldMeta}</small> : null}
          </header>
          <div className="version-diff-content">
            <MarkdownDiffPane
              blocks={diff.oldBlocks}
              changeIds={diff.oldChangeIds}
              side="old"
              activeChangeId={activeChange?.id ?? null}
            />
          </div>
        </section>
        <section>
          <header className="is-new">
            <span>{mode === 'draft' ? '当前草稿' : '此版本'}</span>
            {newMeta ? <small>{newMeta}</small> : null}
          </header>
          <div className="version-diff-content">
            <MarkdownDiffPane
              blocks={diff.newBlocks}
              changeIds={diff.newChangeIds}
              side="new"
              activeChangeId={activeChange?.id ?? null}
            />
          </div>
        </section>
      </div>
    </section>
  )
}
