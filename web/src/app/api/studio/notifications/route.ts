import { NextResponse } from 'next/server'
import { requireOwner } from '@/lib/server-session'
import { listNotifications } from '@/server/notifications'

export async function GET() {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  return NextResponse.json({ notifications: await listNotifications() })
}
