'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface VersionItem {
  id: string
  kind: 'manual' | 'published'
  label: string | null
  title: string
  authorName: string
  authorRole: 'owner' | 'collaborator'
  createdAt: string
  markdown: string
}

export function VersionHistory({
  articleId,
  versions,
  onCompare,
}: {
  articleId: string
  versions: VersionItem[]
  onCompare?: (version: VersionItem, previous: VersionItem) => void
}) {
  const router = useRouter()
  const [label, setLabel] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function saveVersion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage('')
    const response = await fetch(
      `/api/studio/articles/${articleId}/versions`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ label }),
      },
    )
    setPending(false)
    if (!response.ok) {
      setMessage('保存版本失败。')
      return
    }
    setLabel('')
    setMessage('版本已保存')
    router.refresh()
  }

  async function restore(versionId: string) {
    setPending(true)
    setMessage('')
    const response = await fetch(
      `/api/studio/articles/${articleId}/versions/${versionId}/restore`,
      { method: 'POST' },
    )
    setPending(false)
    if (!response.ok) {
      setMessage('恢复版本失败。')
      return
    }
    window.location.reload()
  }

  return (
    <aside className="version-history">
      <p className="eyebrow">Shared versions</p>
      <h2>版本历史</h2>
      <form onSubmit={saveVersion}>
        <label>
          版本说明
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="可选"
          />
        </label>
        <button type="submit" disabled={pending}>
          保存版本
        </button>
      </form>
      {message ? <p role="status">{message}</p> : null}
      <ol>
        {versions.map((version, index) => {
          const previous = versions[index + 1]
          return (
          <li key={version.id}>
            <strong>{version.label || version.title}</strong>
            <span>
              {version.authorName} ·{' '}
              {version.authorRole === 'owner' ? '站主' : '协作者'}
            </span>
            <time dateTime={version.createdAt}>
              {new Intl.DateTimeFormat('zh-CN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(version.createdAt))}
            </time>
            {previous && onCompare ? (
              <button
                type="button"
                aria-label={`与 ${version.label || version.title} 对比上一版本`}
                onClick={() => onCompare(version, previous)}
              >
                与上一版本对照
              </button>
            ) : null}
            <button
              type="button"
              disabled={pending}
              onClick={() => void restore(version.id)}
            >
              恢复为当前草稿
            </button>
          </li>
          )
        })}
      </ol>
    </aside>
  )
}
