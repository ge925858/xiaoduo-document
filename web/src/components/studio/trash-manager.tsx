'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface TrashItem {
  id: string
  title: string
  categoryTitle: string
  trashedAt: string | null
}

export function TrashManager({ initialItems }: { initialItems: TrashItem[] }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function action(id: string, kind: 'restore' | 'delete') {
    setPending(true)
    setMessage('')
    const response = await fetch(`/api/studio/articles/${id}${kind === 'restore' ? '/restore' : ''}`, {
      method: kind === 'restore' ? 'POST' : 'DELETE',
    })
    setPending(false)
    if (!response.ok) {
      setMessage('操作失败，请重试。')
      return
    }
    router.refresh()
  }

  return (
    <div className="trash-manager">
      {message ? <p role="alert">{message}</p> : null}
      {!initialItems.length ? <p>回收站为空。</p> : null}
      <ol>
        {initialItems.map((item) => (
          <li key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <span>{item.categoryTitle}</span>
              <time dateTime={item.trashedAt ?? undefined}>
                {item.trashedAt
                  ? new Intl.DateTimeFormat('zh-CN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(item.trashedAt))
                  : ''}
              </time>
            </div>
            <div className="category-actions">
              <button
                type="button"
                disabled={pending}
                onClick={() => void action(item.id, 'restore')}
              >
                恢复章节
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => void action(item.id, 'delete')}
              >
                永久删除
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
