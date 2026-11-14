'use client'

import Link from 'next/link'
import { KeyRound, LoaderCircle } from 'lucide-react'
import { useState } from 'react'

const errors: Record<string, string> = {
  USED: '此重置链接已使用。',
  EXPIRED: '此重置链接已过期，请重新生成。',
  INVALID: '重置链接无效。',
  PASSWORD_MISMATCH: '两次输入的密码不一致。',
  RESET_FAILED: '密码更新失败，请稍后重试。',
}

export function PasswordResetForm({
  token,
  expiresAt,
}: {
  token: string
  expiresAt: string
}) {
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const data = new FormData(event.currentTarget)
    const password = String(data.get('password') ?? '')
    if (password !== String(data.get('confirmPassword') ?? '')) {
      setError(errors.PASSWORD_MISMATCH)
      return
    }
    setPending(true)
    const response = await fetch('/api/collaboration/password-reset/accept', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    setPending(false)
    if (response.ok) {
      setCompleted(true)
      return
    }
    const payload = (await response.json()) as { result?: string }
    setError(
      errors[payload.result?.toUpperCase() ?? ''] ?? errors.RESET_FAILED,
    )
  }

  if (completed) {
    return (
      <div className="invitation-result">
        <p role="status">密码已更新，可以重新登录。</p>
        <Link href="/studio/login" className="invite-state-action">
          前往登录
        </Link>
      </div>
    )
  }

  return (
    <form className="invite-activation-form" onSubmit={submit}>
      <label className="invite-field">
        <span>新密码</span>
        <div className="invite-input-wrap">
          <KeyRound size={15} />
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            placeholder="至少 8 个字符"
            required
          />
        </div>
      </label>
      <label className="invite-field">
        <span>确认新密码</span>
        <div className="invite-input-wrap">
          <KeyRound size={15} />
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            placeholder="再次输入新密码"
            required
          />
        </div>
      </label>
      <p className="invite-expiry">重置链接将在 {expiresAt} 过期。</p>
      {error ? (
        <p role="alert" className="invite-form-error">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="invite-submit-button"
        disabled={pending}
      >
        {pending ? <LoaderCircle className="animate-spin" size={15} /> : null}
        {pending ? '正在更新…' : '设置新密码'}
      </button>
    </form>
  )
}
