'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const data = new FormData(event.currentTarget)
    const response = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: String(data.get('email') ?? ''),
        password: String(data.get('password') ?? ''),
      }),
    })
    setPending(false)

    if (!response.ok) {
      setError('邮箱或密码不正确，或账号已停用。')
      return
    }
    router.replace('/studio')
    router.refresh()
  }

  return (
    <form className="studio-form" onSubmit={onSubmit}>
      <label>
        邮箱
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        密码
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {error ? <p role="alert">{error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? '正在进入…' : '进入写作台'}
      </button>
    </form>
  )
}
