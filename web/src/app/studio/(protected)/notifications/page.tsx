import { redirect } from 'next/navigation'
import { NotificationCenter } from '@/components/studio/notification-center'
import { requireOwner } from '@/lib/server-session'
import { listNotifications } from '@/server/notifications'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const session = await requireOwner()
  if (!session) redirect('/studio')
  const notifications = (await listNotifications()).map((item) => ({
    ...item,
    readAt: item.readAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
  }))
  return (
    <section>
      <p className="eyebrow">Notifications</p>
      <h1>通知中心</h1>
      <NotificationCenter initialItems={notifications} />
    </section>
  )
}
