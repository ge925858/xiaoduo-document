'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface NotificationItem {
  id: string
  kind: string
  title: string
  body: string
  href: string | null
  readAt: string | null
  createdAt: string
}

export function NotificationCenter({
  initialItems,
}: {
  initialItems: NotificationItem[]
}) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [message, setMessage] = useState('')

  async function markRead(id: string) {
    const response = await fetch(`/api/studio/notifications/${id}/read`, {
      method: 'POST',
    })
    if (!response.ok) {
      setMessage('标记已读失败')
      return
    }
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, readAt: new Date().toISOString() }
          : item,
      ),
    )
    setMessage('已读')
    router.refresh()
  }

  async function markAllRead() {
    const response = await fetch('/api/studio/notifications/read-all', {
      method: 'POST',
    })
    if (!response.ok) {
      setMessage('全部标记失败')
      return
    }
    const readAt = new Date().toISOString()
    setItems((current) =>
      current.map((item) => ({ ...item, readAt: item.readAt ?? readAt })),
    )
    setMessage('全部已读')
    router.refresh()
  }

  return (
    <div className="notification-center">
      <div className="notification-toolbar">
        <span>{items.filter((item) => !item.readAt).length} 条未读</span>
        <button type="button" onClick={() => void markAllRead()}>
          全部标记已读
        </button>
      </div>
      {message ? <p role="status">{message}</p> : null}
      {!items.length ? <p>暂无通知。</p> : null}
      <ol>
        {items.map((item) => (
          <li key={item.id} className={item.readAt ? 'is-read' : 'is-unread'}>
            <div>
              <p>{item.kind}</p>
              <h2>{item.title}</h2>
              <span>{item.body}</span>
              <time dateTime={item.createdAt}>
                {new Intl.DateTimeFormat('zh-CN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(item.createdAt))}
              </time>
            </div>
            <div className="category-actions">
              {item.href ? <a href={item.href}>查看</a> : null}
              {!item.readAt ? (
                <button
                  type="button"
                  aria-label={`标记已读 ${item.title}`}
                  onClick={() => void markRead(item.id)}
                >
                  标记已读
                </button>
              ) : (
                <span>已读</span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
