'use client'

import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { RotateCcw, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface TrashItem {
  id: string
  title: string
  categoryTitle: string
  plainText: string
  trashedAt: string | null
  trashedByName: string | null
}

function relativeTime(value: string | null): string {
  if (!value) return ''
  const diff = Date.now() - new Date(value).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days <= 0) return '今天'
  if (days === 1) return '1 天前'
  return `${days} 天前`
}

export function TrashManager({
  initialItems,
  canDelete,
  isOwner,
}: {
  initialItems: TrashItem[]
  canDelete: boolean
  isOwner: boolean
}) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TrashItem | null>(null)
  const [now] = useState(() => Date.now())

  async function restore(id: string) {
    setPending(true)
    setMessage('')
    const response = await fetch(`/api/studio/articles/${id}/restore`, {
      method: 'POST',
    })
    setPending(false)
    if (!response.ok) {
      setMessage('恢复失败，请重试。')
      return
    }
    setMessage('章节已恢复为未发布草稿')
    router.refresh()
  }

  async function permanentlyDelete(item: TrashItem) {
    setPending(true)
    setMessage('')
    const response = await fetch(`/api/studio/articles/${item.id}`, {
      method: 'DELETE',
    })
    setPending(false)
    if (!response.ok) {
      setMessage('永久删除失败，请重试。')
      return
    }
    setDeleteTarget(null)
    setMessage('章节已永久删除')
    router.refresh()
  }

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

      {message ? (
        <p className="trash-feedback" role="status">
          {message}
        </p>
      ) : null}

      <div className="studio-trash-list">
        {initialItems.map((item) => {
          const daysLeft = Math.max(
            0,
            30 -
              Math.floor(
                (now - new Date(item.trashedAt ?? '').getTime()) /
                  86_400_000,
              ),
          )
          return (
            <article key={item.id} className="studio-trash-row">
              <span className="studio-trash-icon">
                <Trash2 size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <h2>{item.title}</h2>
                <p>
                  {item.categoryTitle} · {item.plainText || '没有正文'}
                </p>
              </div>
              <div className="studio-trash-meta">
                <span>{relativeTime(item.trashedAt)}删除</span>
                {isOwner ? (
                  <span>由 {item.trashedByName ?? '站主'} 移入</span>
                ) : null}
                <span>{daysLeft} 天后永久删除</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="studio-icon-button"
                  disabled={pending}
                  onClick={() => void restore(item.id)}
                  aria-label="恢复章节"
                  title="恢复章节"
                >
                  <RotateCcw size={15} />
                </button>
                {canDelete ? (
                  <button
                    type="button"
                    className="studio-icon-button hover:!text-[var(--rust)]"
                    disabled={pending}
                    onClick={() => setDeleteTarget(item)}
                    aria-label="永久删除章节"
                    title="永久删除章节"
                  >
                    <Trash2 size={15} />
                  </button>
                ) : null}
              </div>
            </article>
          )
        })}

        {!initialItems.length ? (
          <div className="studio-trash-empty">
            <Trash2 size={22} />
            <p>回收站是空的</p>
            <span>移到这里的章节会保留 30 天。</span>
            <span className="sr-only">回收站为空。</span>
          </div>
        ) : null}
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
                  className="trash-danger-button"
                  onClick={() => {
                    if (deleteTarget) void permanentlyDelete(deleteTarget)
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
