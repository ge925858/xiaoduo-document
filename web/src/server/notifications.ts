import { desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { notification } from '@/db/schema'

export type NotificationKind =
  | 'application'
  | 'invitation'
  | 'grant'
  | 'publish'

export interface NotificationRecord {
  id: string
  eventKey: string
  kind: NotificationKind
  title: string
  body: string
  href: string | null
  readAt: Date | null
  createdAt: Date
}

export async function createNotification(input: {
  eventKey: string
  kind: NotificationKind
  title: string
  body: string
  href?: string | null
}) {
  await db
    .insert(notification)
    .values({
      id: crypto.randomUUID(),
      eventKey: input.eventKey,
      kind: input.kind,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
    })
    .onDuplicateKeyUpdate({ set: { eventKey: input.eventKey } })
}

export async function listNotifications(): Promise<NotificationRecord[]> {
  return db.select().from(notification).orderBy(desc(notification.createdAt))
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const result = await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(eq(notification.id, id))
  return result[0].affectedRows > 0
}

export async function markAllNotificationsRead() {
  await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(isNull(notification.readAt))
}
