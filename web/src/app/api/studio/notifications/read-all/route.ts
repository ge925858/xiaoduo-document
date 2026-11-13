import { NextResponse } from 'next/server'
import { authorizeOwnerMutation } from '@/lib/studio-request'
import { markAllNotificationsRead } from '@/server/notifications'

export async function POST(request: Request) {
  const authorization = await authorizeOwnerMutation(request)
  if (authorization.error) return authorization.error
  await markAllNotificationsRead()
  return NextResponse.json({ read: true })
}
