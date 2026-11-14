'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  LoaderCircle,
  Mail,
} from 'lucide-react'

type LoginMode = 'owner' | 'collaborator'

export function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<LoginMode>('owner')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
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
    <main className="studio-login-page">
      <section className="studio-login-art">
        <div className="studio-login-grid" aria-hidden="true" />
        <div className="relative z-10 flex h-full flex-col">
          <Link href="/" className="studio-back-site">
            <ArrowLeft size={18} />
            返回知笺
          </Link>
          <div className="my-auto">
            <p className="text-[13px] uppercase tracking-[0.28em] text-white/45">
              Private writing room
            </p>
            <h1 className="mt-6 font-display text-[clamp(46px,6vw,80px)] leading-[1.13] text-white/94">
              把还没想清楚的，
              <br />
              先写下来。
            </h1>
          </div>
          <p className="border-t border-white/12 pt-5 text-[13px] leading-5 text-white/38">
            站主和受邀协作者可以进入，协作者只会看到被授权的文章。
          </p>
        </div>
      </section>

      <section className="studio-login-form">
        <div className="w-full max-w-[390px]">
          <p className="section-kicker">Studio access</p>
          <h1 className="mt-3 font-display text-[38px] text-[var(--ink)]">
            进入写作台
          </h1>
          <p className="mt-3 text-xs leading-6 text-[var(--muted)]">
            站主可以管理内容与授权，协作者只能进入被授权的文章。
          </p>

          <div className="segmented-control mt-7">
            <button
              type="button"
              className={mode === 'owner' ? 'is-active' : ''}
              onClick={() => {
                setMode('owner')
                setError('')
              }}
            >
              站主登录
            </button>
            <button
              type="button"
              className={mode === 'collaborator' ? 'is-active' : ''}
              onClick={() => {
                setMode('collaborator')
                setError('')
              }}
            >
              协作者登录
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-9">
            <label className="mb-4 block">
              <span className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--ink-soft)]">
                <Mail size={18} />
                邮箱
              </span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder={
                  mode === 'owner'
                    ? '输入站主邮箱'
                    : '邀请时使用的邮箱'
                }
                className="h-11 w-full rounded-[5px] border border-[var(--line)] bg-[var(--field)] px-3 text-sm text-[var(--ink)] outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--ink-soft)]">
                <KeyRound size={18} />
                {mode === 'owner' ? '站主密码' : '密码'}
              </span>
              <input
                name="password"
                aria-label="密码"
                type="password"
                autoComplete="current-password"
                required
                autoFocus
                placeholder={
                  mode === 'owner' ? '输入站主密码' : '输入账号密码'
                }
                className="h-11 w-full rounded-[5px] border border-[var(--line)] bg-[var(--field)] px-3 text-sm text-[var(--ink)] outline-none"
              />
            </label>
            {error ? (
              <p className="mt-3 text-xs text-[var(--rust)]" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              aria-label="进入写作台"
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[5px] bg-[var(--accent)] text-sm font-medium text-[var(--accent-contrast)] hover:bg-[var(--accent-strong)] disabled:opacity-50"
            >
              {pending ? (
                <LoaderCircle className="animate-spin" size={20} />
              ) : (
                <ArrowRight size={20} />
              )}
              进入写作台
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
