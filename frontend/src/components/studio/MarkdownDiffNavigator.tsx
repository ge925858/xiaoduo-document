import { useEffect, useRef, useState } from 'react'
import { diffWordsWithSpace } from 'diff'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { MarkdownArticle } from '../public/MarkdownArticle'
import { cn } from '../../lib/utils'
import {
  blockTypeLabel,
  changeExcerpt,
  changeLabel,
  type MarkdownDiffBlock,
  type MarkdownDiffChange,
} from '../../lib/markdownDiff'

export function MarkdownDiffNavigator({
  changes,
  activeChangeId,
  onSelect,
}: {
  changes: MarkdownDiffChange[]
  activeChangeId: string | null
  onSelect: (change: MarkdownDiffChange) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const activeIndex = changes.findIndex(
    (change) => change.id === activeChangeId,
  )
  const counts = changes.reduce(
    (result, change) => {
      result[change.kind] += 1
      return result
    },
    { added: 0, removed: 0, modified: 0 },
  )

  const selectOffset = (offset: number) => {
    if (!changes.length) return
    const currentIndex = activeIndex >= 0 ? activeIndex : 0
    const nextIndex =
      (currentIndex + offset + changes.length) % changes.length
    onSelect(changes[nextIndex])
    setExpanded(false)
  }

  if (!changes.length) {
    return (
      <div className="markdown-diff-navigator is-empty">
        <span>当前没有内容差异</span>
      </div>
    )
  }

  return (
    <div className="markdown-diff-navigator">
      <button
        type="button"
        className="markdown-diff-summary"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        <span>
          共 {changes.length} 处变化
          <small>
            <span className="is-added">新增 {counts.added}</span>
            <span className="is-removed">删除 {counts.removed}</span>
            <span className="is-modified">修改 {counts.modified}</span>
          </small>
        </span>
        <ChevronDown
          size={15}
          className={cn(expanded && 'rotate-180')}
        />
      </button>
      <div className="markdown-diff-arrows">
        <button
          type="button"
          onClick={() => selectOffset(-1)}
          aria-label="上一处变化"
          title="上一处变化"
        >
          <ChevronLeft size={15} />
        </button>
        <span>
          {activeIndex >= 0 ? activeIndex + 1 : 0}/{changes.length}
        </span>
        <button
          type="button"
          onClick={() => selectOffset(1)}
          aria-label="下一处变化"
          title="下一处变化"
        >
          <ChevronRight size={15} />
        </button>
      </div>
      {expanded && (
        <div className="markdown-diff-change-list">
          {changes.map((change, index) => (
            <button
              key={change.id}
              type="button"
              className={cn(
                'markdown-diff-change-item',
                change.kind,
                activeChangeId === change.id && 'is-active',
              )}
              onClick={() => {
                onSelect(change)
                setExpanded(false)
              }}
            >
              <span className="markdown-diff-change-index">{index + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="markdown-diff-change-title">
                  {changeLabel(change)} · {change.heading}
                  {change.after?.kind && (
                    <small>{blockTypeLabel(change.after.kind)}</small>
                  )}
                </span>
                <InlineDiffText change={change} />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function InlineDiffText({ change }: { change: MarkdownDiffChange }) {
  if (change.kind === 'modified' && change.before && change.after) {
    return (
      <span className="markdown-inline-diff">
        {diffWordsWithSpace(change.before.text, change.after.text).map(
          (part, index) => (
            <span
              key={`${part.value}-${index}`}
              className={cn(
                part.added && 'is-added',
                part.removed && 'is-removed',
              )}
            >
              {part.value}
            </span>
          ),
        )}
      </span>
    )
  }
  return (
    <span className="markdown-diff-change-excerpt">
      {changeExcerpt(change) || '内容块为空'}
    </span>
  )
}

export function MarkdownDiffPane({
  blocks,
  changeIds,
  side,
  activeChangeId,
  className,
}: {
  blocks: MarkdownDiffBlock[]
  changeIds: Array<string | null>
  side: 'old' | 'new'
  activeChangeId: string | null
  className?: string
}) {
  const activeRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }, [activeChangeId])

  return (
    <div className={cn('markdown-diff-rendered', className)}>
      {blocks.map((block) => {
        const changeId = changeIds[block.index]
        const active = Boolean(changeId && changeId === activeChangeId)
        return (
          <div
            key={`${side}-${block.index}`}
            ref={active ? activeRef : undefined}
            className={cn(
              'markdown-diff-block',
              active && 'is-active',
              changeId && side === 'old' && 'is-changed-old',
              changeId && side === 'new' && 'is-changed-new',
            )}
          >
            <MarkdownArticle markdown={block.markdown} />
          </div>
        )
      })}
      {!blocks.length && (
        <p className="version-diff-empty">这个版本没有正文内容</p>
      )}
    </div>
  )
}
