import Link from 'next/link'
import { InvitationActivationForm } from '@/components/invitation-activation-form'
import { getInvitationActivationPreview } from '@/server/collaboration'

export const dynamic = 'force-dynamic'

const statusMessages = {
  activated: '此邀请已经激活，请直接登录。',
  expired: '此邀请已过期，请联系站主重新邀请。',
  revoked: '此邀请已撤销，请联系站主。',
} as const

export default async function InvitationActivationPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const invite = await getInvitationActivationPreview(token)

  if (!invite) {
    return (
      <main className="invitation-page">
        <h1>邀请链接无效</h1>
        <p role="alert">请联系站主确认邀请链接是否完整。</p>
      </main>
    )
  }

  if (invite.status !== 'pending') {
    return (
      <main className="invitation-page">
        <p className="eyebrow">Collaborator invitation</p>
        <h1>{statusMessages[invite.status]}</h1>
        <Link href="/studio/login">前往登录</Link>
      </main>
    )
  }

  return (
    <main className="invitation-page">
      <p className="eyebrow">Collaborator invitation</p>
      <h1>激活协作者账号</h1>
      <p>
        绑定的邮箱：<strong>{invite.email}</strong>
      </p>
      <p>获授权章节：{invite.articleTitles.join('、')}</p>
      <InvitationActivationForm
        token={token}
        initialDisplayName={invite.displayName ?? ''}
      />
    </main>
  )
}
