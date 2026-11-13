import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@/components/studio/sign-out-button'
import { getServerSession } from '@/lib/server-session'

export default async function ProtectedStudioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession()
  if (!session || session.user.status !== 'active') {
    redirect('/studio/login')
  }

  return (
    <div className="studio-shell">
      <aside className="studio-sidebar">
        <strong>知笺写作台</strong>
        <nav>
          <Link href="/studio">文章</Link>
          <Link href="/studio/trash">回收站</Link>
          {session.user.role === 'owner' ? (
            <>
              <Link href="/studio/categories">分类</Link>
              <Link href="/studio/collaboration">协作</Link>
              <Link href="/studio/notifications">通知</Link>
              <Link href="/studio/analytics">访问统计</Link>
              <Link href="/studio/settings">站点资料</Link>
            </>
          ) : null}
          <Link href="/">返回公开站</Link>
        </nav>
        <div className="studio-account">
          <span>{session.user.name}</span>
          <SignOutButton />
        </div>
      </aside>
      <main className="studio-main">{children}</main>
    </div>
  )
}
