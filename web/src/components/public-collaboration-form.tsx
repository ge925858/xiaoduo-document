'use client'

import { UserRoundPlus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

export function PublicCollaborationForm({
  articleId,
  articleTitle,
}: {
  articleId: string
  articleTitle: string
}) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setPending(true)
    setMessage('')
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
    setPending(false)
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
    <>
      <section className="collaboration-apply-card">
        <div>
          <strong>愿意一起完善这篇笔记？</strong>
          <p>申请通过后，只会获得这篇文章的编辑权限。</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
        >
          <UserRoundPlus size={14} />
          申请参与编辑
        </Button>
      </section>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="申请参与编辑"
        description={`申请通过后，只会获得《${articleTitle}》的编辑权限。`}
      >
        <form className="collaboration-application-form" onSubmit={submit}>
          <label>
            <span>昵称</span>
            <input name="name" required maxLength={120} />
          </label>
          <label>
            <span>邮箱</span>
            <input name="email" type="email" required />
          </label>
          <label>
            <span>申请备注</span>
            <textarea name="note" rows={3} maxLength={2000} />
          </label>
          {message ? <p role="status">{message}</p> : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? '正在提交…' : '提交申请'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  )
}
