'use client'

import Link from 'next/link'
import { KeyRound, LoaderCircle, UserRound } from 'lucide-react'
import { useState } from 'react'

const errors: Record<string, string> = {
  ALREADY_ACTIVATED: '此邀请已经激活，请直接登录。',
  EXPIRED: '此邀请已过期，请联系站主重新邀请。',
  REVOKED: '此邀请已撤销，请联系站主。',
  NOT_FOUND: '邀请链接无效。',
  INVALID_ACTIVATION: '请填写显示名称，并使用至少 8 位密码。',
  PASSWORD_MISMATCH: '两次输入的密码不一致。',
  ACTIVATION_FAILED: '激活失败，请稍后重试。',
}

export function InvitationActivationForm({
  token,
  initialDisplayName,
  expiresAt,
}: {
  token: string
  initialDisplayName: string
  expiresAt: string
}) {
  const [error, setError] = useState('')
  const [activated, setActivated] = useState(false)
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
    const response = await fetch('/api/collaboration/invites/accept', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token,
        displayName: String(data.get('displayName') ?? ''),
        password,
      }),
    })
    setPending(false)
    if (response.ok) {
      setActivated(true)
      return
    }
    const payload = (await response.json()) as { error?: string }
    setError(errors[payload.error ?? ''] ?? errors.ACTIVATION_FAILED)
  }

  if (activated) {
    return (
      <div className="invitation-result">
        <p role="status">账号已激活，现在可以登录写作台。</p>
        <Link href="/studio/login" className="invite-state-action">
          前往登录
        </Link>
      </div>
    )
  }

  return (
    <form className="invite-activation-form" onSubmit={submit}>
      <label className="invite-field">
        <span>昵称</span>
        <div className="invite-input-wrap">
          <UserRound size={15} />
          <input
            name="displayName"
            defaultValue={initialDisplayName}
            maxLength={32}
            placeholder="协作者昵称"
            required
          />
        </div>
      </label>
      <label className="invite-field">
        <span>设置密码</span>
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
        <span>确认密码</span>
        <div className="invite-input-wrap">
          <KeyRound size={15} />
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            placeholder="再次输入密码"
            required
          />
        </div>
      </label>
      <p className="invite-expiry">邀请将在 {expiresAt} 过期。</p>
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
        {pending ? '正在激活…' : '激活协作账号'}
      </button>
    </form>
  )
}
