import { useEffect, useMemo, useState } from 'react'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { RotateCcw, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { formatRelativeTime } from '../../lib/text'
import { usePageTitle } from '../../lib/usePageTitle'
import { useSiteStore } from '../../store/siteStore'

export function TrashPage() {
  usePageTitle('回收站 · 知笺')
  const notes = useSiteStore((state) => state.notes)
  const categories = useSiteStore((state) => state.categories)
  const studioRole = useSiteStore((state) => state.studioRole)
  const currentCollaboratorId = useSiteStore(
    (state) => state.currentCollaboratorId,
  )
  const restoreTrashedNote = useSiteStore((state) => state.restoreTrashedNote)
  const deleteNoteForever = useSiteStore((state) => state.deleteNoteForever)
  const purgeExpiredTrash = useSiteStore((state) => state.purgeExpiredTrash)
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [now] = useState(() => Date.now())
  const isOwner = studioRole === 'owner'
  const trashed = useMemo(
    () =>
      notes
        .filter(
          (note) =>
            note.trashedAt &&
            (isOwner || note.trashedBy === currentCollaboratorId),
        )
        .sort((a, b) => (b.trashedAt ?? '').localeCompare(a.trashedAt ?? '')),
    [currentCollaboratorId, isOwner, notes],
  )

  useEffect(() => {
    purgeExpiredTrash()
  }, [purgeExpiredTrash])

  return (
    <div className="studio-page max-w-[980px]">
      <header className="studio-page-header">
        <div>
          <p className="section-kicker">Trash</p>
          <h1>回收站</h1>
          <p>
            {isOwner
              ? '站主可以查看所有协作者移入的章节。章节保留 30 天，恢复后需要重新发布。'
              : '这里只显示你移入回收站的章节。章节保留 30 天，恢复后需要重新发布。'}
          </p>
        </div>
      </header>

      <div className="studio-trash-list">
        {trashed.map((note) => {
          const category = categories.find((item) => item.id === note.categoryId)
          const daysLeft = Math.max(
            0,
            30 -
              Math.floor(
              (now - new Date(note.trashedAt ?? '').getTime()) /
                  86_400_000,
              ),
          )
          return (
            <article key={note.id} className="studio-trash-row">
              <span className="studio-trash-icon">
                <Trash2 size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <h2>{note.title}</h2>
                <p>
                  {category?.title ?? '未分类'} · {note.plainText || '没有正文'}
                </p>
              </div>
              <div className="studio-trash-meta">
                <span>{formatRelativeTime(note.trashedAt ?? '')}删除</span>
                {isOwner && (
                  <span>由 {note.trashedByName ?? '站主'} 移入</span>
                )}
                <span>{daysLeft} 天后永久删除</span>
              </div>
              <div className="flex items-center gap-1">
                {(isOwner ||
                  note.trashedBy === currentCollaboratorId) && (
                  <button
                    type="button"
                    className="studio-icon-button"
                    onClick={() => {
                      restoreTrashedNote(note.id)
                      toast.success('章节已恢复为未发布草稿')
                      navigate(`/studio/notes/${note.id}`)
                    }}
                    aria-label="恢复章节"
                    title="恢复章节"
                  >
                    <RotateCcw size={19} />
                  </button>
                )}
                {isOwner && (
                  <button
                    type="button"
                    className="studio-icon-button hover:!text-[var(--rust)]"
                    onClick={() => setDeleteTarget(note.id)}
                    aria-label="永久删除章节"
                    title="永久删除章节"
                  >
                    <Trash2 size={19} />
                  </button>
                )}
              </div>
            </article>
          )
        })}

        {!trashed.length && (
          <div className="studio-trash-empty">
            <Trash2 size={26} />
            <p>回收站是空的</p>
            <span>移到这里的章节会保留 30 天。</span>
          </div>
        )}
      </div>

      <AlertDialog.Root
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="dialog-overlay fixed inset-0 z-[90] bg-[#0d120f]/55 backdrop-blur-[2px]" />
          <AlertDialog.Content className="dialog-content fixed left-1/2 top-1/2 z-[91] w-[min(92vw,430px)] -translate-x-1/2 -translate-y-1/2 rounded-[7px] border border-[var(--line-strong)] bg-[var(--paper)] p-5 shadow-2xl">
            <AlertDialog.Title className="font-display text-xl text-[var(--ink)]">
              永久删除这个章节？
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-xs leading-6 text-[var(--muted)]">
              章节正文、全部历史版本和原网址都会被删除，这个操作无法撤销。
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <button type="button" className="studio-secondary-button">
                  取消
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  type="button"
                  className="inline-flex h-8 items-center rounded-[4px] bg-[var(--rust)] px-3 text-[13px] font-medium text-white"
                  onClick={() => {
                    if (!deleteTarget) return
                    deleteNoteForever(deleteTarget)
                    setDeleteTarget(null)
                    toast.success('章节已永久删除')
                  }}
                >
                  永久删除
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  )
}
