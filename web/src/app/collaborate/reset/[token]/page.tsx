import Link from 'next/link'
import { PasswordResetForm } from '@/components/password-reset-form'
import { getPasswordResetPreview } from '@/server/collaboration'

export const dynamic = 'force-dynamic'

export default async function PasswordResetPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const reset = await getPasswordResetPreview(token)

  if (!reset) {
    return (
      <main className="invitation-page">
        <h1>重置链接无效</h1>
        <p role="alert">请联系站主重新生成密码重置链接。</p>
      </main>
    )
  }

  if (reset.status !== 'pending') {
    return (
      <main className="invitation-page">
        <p className="eyebrow">Password reset</p>
        <h1>
          {reset.status === 'used'
            ? '此重置链接已使用。'
            : '此重置链接已过期。'}
        </h1>
        <Link href="/studio/login">前往登录</Link>
      </main>
    )
  }

  return (
    <main className="invitation-page">
      <p className="eyebrow">Password reset</p>
      <h1>设置新密码</h1>
      <p>
        账号邮箱：<strong>{reset.email}</strong>
      </p>
      <PasswordResetForm token={token} />
    </main>
  )
}
