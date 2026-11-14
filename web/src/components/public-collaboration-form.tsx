'use client'

import { Send, UserRoundPlus } from 'lucide-react'
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
  const [messageIsError, setMessageIsError] = useState(false)
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setPending(true)
    setMessage('')
    try {
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
      setMessageIsError(!response.ok)
      setMessage(
        response.ok
          ? '申请已提交，等待站主审核。'
          : response.status === 409
            ? '这篇章节已有待审核申请。'
            : '提交失败，请稍后重试。',
      )
      if (response.ok) form.reset()
    } catch {
      setMessageIsError(true)
      setMessage('提交失败，请稍后重试。')
    } finally {
      setPending(false)
    }
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
        description={`申请将关联《${articleTitle}》，审核通过后才会收到邀请。`}
      >
        <form className="collaboration-application-form" onSubmit={submit}>
          <label>
            <span>昵称</span>
            <input
              name="name"
              required
              autoFocus
              maxLength={32}
              placeholder="怎么称呼你"
            />
          </label>
          <label>
            <span>邮箱</span>
            <input
              name="email"
              type="email"
              required
              placeholder="用于接收邀请和登录"
            />
          </label>
          <label>
            <span>申请说明</span>
            <textarea
              name="note"
              rows={4}
              maxLength={500}
              placeholder="简单说明你希望补充或修改的内容"
            />
          </label>
          <p className="collaboration-form-hint">
            此时不会创建账号，也不需要设置密码。审核通过后，站主会生成一次性邀请链接。
          </p>
          {message ? (
            <p role={messageIsError ? 'alert' : 'status'}>{message}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              <Send size={14} />
              {pending ? '正在提交…' : '提交申请'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  )
}
