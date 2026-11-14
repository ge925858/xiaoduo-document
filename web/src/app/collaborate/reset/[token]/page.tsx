import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'
import { PasswordResetForm } from '@/components/password-reset-form'
import { formatDateTime } from '@/lib/format-time'
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
      <ResetState
        title="重置链接不存在"
        description="请联系站主重新生成密码重置链接。"
      />
    )
  }

  if (reset.status !== 'pending') {
    return (
      <ResetState
        title={
          reset.status === 'used'
            ? '重置链接已使用'
            : '重置链接已过期'
        }
        description={
          reset.status === 'used'
            ? '此重置链接已使用。'
            : '此重置链接已过期，请重新生成。'
        }
      />
    )
  }

  return (
    <main className="invite-accept-page">
      <div className="invite-accept-card">
        <Link href="/" className="invite-back-link">
          <ArrowLeft size={14} />
          返回知笺
        </Link>
        <p className="section-kicker mt-8">Password reset</p>
        <h1>设置新密码</h1>
        <p className="invite-accept-intro">
          为协作者账号设置一个新密码，旧会话将立即失效。
        </p>
        <div className="invite-account-email">
          <Mail size={15} />
          <span>{reset.email}</span>
        </div>
        <PasswordResetForm
          token={token}
          expiresAt={formatDateTime(reset.expiresAt.toISOString())}
        />
      </div>
    </main>
  )
}

function ResetState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <main className="invite-accept-page">
      <div className="invite-state-card">
        <p className="section-kicker">Password reset</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <Link href="/studio/login" className="invite-state-action">
          前往登录
        </Link>
      </div>
    </main>
  )
}
