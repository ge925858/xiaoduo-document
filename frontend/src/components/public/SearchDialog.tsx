import { useEffect, useMemo, useRef, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ArrowRight, FileText, Layers3, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSiteStore } from '../../store/siteStore'

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const notes = useSiteStore((state) => state.notes)
  const categories = useSiteStore((state) => state.categories)

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const matchedNotes = notes
      .filter(
        (note) =>
          note.publicationState === 'published' &&
          note.published !== null &&
          !note.trashedAt &&
          (!normalized ||
            note.published.title.toLowerCase().includes(normalized) ||
            note.published.plainText.toLowerCase().includes(normalized)),
      )
      .sort((a, b) =>
        (b.published?.publishedAt ?? '').localeCompare(
          a.published?.publishedAt ?? '',
        ),
      )
      .slice(0, 7)
    const matchedCategories = categories
      .filter(
        (category) =>
          !normalized || category.title.toLowerCase().includes(normalized),
      )
      .slice(0, 4)
    return { notes: matchedNotes, categories: matchedCategories }
  }, [categories, notes, query])

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 30)
  }, [open])

  const go = (path: string) => {
    onOpenChange(false)
    navigate(path)
  }

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setQuery('')
        onOpenChange(nextOpen)
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay fixed inset-0 z-[90] bg-[#121a16]/52 backdrop-blur-[3px]" />
        <DialogPrimitive.Content className="dialog-content search-dialog fixed left-1/2 top-[14vh] z-[91] w-[min(92vw,680px)] -translate-x-1/2 overflow-hidden rounded-[8px] border border-[var(--line-strong)] bg-[var(--paper)] shadow-2xl">
          <DialogPrimitive.Title className="sr-only">搜索知笺</DialogPrimitive.Title>
          <div className="flex h-15 items-center gap-3 border-b border-[var(--line)] px-5">
            <Search size={22} className="text-[var(--muted)]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索分类或章节"
              className="h-full flex-1 border-0 bg-transparent text-[18px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-faint)]"
            />
            <span className="text-[12px] tracking-[0.14em] text-[var(--muted-faint)] uppercase">
              ESC
            </span>
          </div>

          <div className="max-h-[64vh] overflow-y-auto px-3 py-3">
            {!!results.categories.length && (
              <SearchSection label="分类">
                {results.categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className="search-result-row"
                    data-visual-dynamic
                    onClick={() => go(`/library/${category.slug}`)}
                  >
                    <span className="search-result-icon">
                      <Layers3 size={19} />
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-semibold text-[var(--ink)]">
                      {category.title}
                    </span>
                    <ArrowRight size={18} className="text-[var(--muted-faint)]" />
                  </button>
                ))}
              </SearchSection>
            )}

            {!!results.notes.length && (
              <SearchSection label="章节">
                {results.notes.map((note) => {
                  const published = note.published
                  if (!published) return null
                  const category = categories.find(
                    (item) => item.id === published.categoryId,
                  )
                  return (
                    <button
                      key={note.id}
                      type="button"
                      className="search-result-row"
                      onClick={() =>
                        go(
                          `/library/${category?.slug ?? 'uncategorized'}/${published.slug}`,
                        )
                      }
                    >
                      <span className="search-result-icon">
                        <FileText size={19} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[var(--ink)]">
                          {published.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs leading-5 text-[var(--muted)]">
                          {published.plainText.slice(0, 110)}
                        </span>
                      </span>
                      <ArrowRight size={18} className="text-[var(--muted-faint)]" />
                    </button>
                  )
                })}
              </SearchSection>
            )}

            {!results.notes.length && !results.categories.length && (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <p className="font-display text-xl text-[var(--ink)]">
                  没有找到相关内容
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  试试更短的词。
                </p>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function SearchSection({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-3 last:mb-0">
      <p className="px-2 pb-1 pt-2 text-[12px] font-semibold tracking-[0.18em] text-[var(--muted-faint)] uppercase">
        {label}
      </p>
      <div>{children}</div>
    </section>
  )
}
