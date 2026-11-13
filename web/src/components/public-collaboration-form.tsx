'use client'

import { useState } from 'react'

export function PublicCollaborationForm({
  articleId,
}: {
  articleId: string
}) {
  const [message, setMessage] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const response = await fetch('/api/collaboration/applications', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        articleId,
        name: String(data.get('name') ?? ''),
        email: String(data.get('email') ?? ''),
        note: String(data.get('note') ?? ''),
      }),
    })
    setMessage(
      response.ok
        ? '申请已提交，等待站主审核。'
        : response.status === 409
          ? '这篇章节已有待审核申请。'
          : '提交失败，请稍后重试。',
    )
    if (response.ok) form.reset()
  }

  return (
    <section className="collaboration-application">
      <h2>申请参与编辑</h2>
      <p>申请不会创建账号，也不会立即获得编辑权限。</p>
      <form onSubmit={submit}>
        <label>昵称<input name="name" required maxLength={120} /></label>
        <label>邮箱<input name="email" type="email" required /></label>
        <label>申请备注<textarea name="note" rows={3} maxLength={2000} /></label>
        <button type="submit">提交申请</button>
      </form>
      {message ? <p role="status">{message}</p> : null}
    </section>
  )
}
