import { NextResponse } from 'next/server'
import { authorizeOwnerMutation } from '@/lib/studio-request'
import { markNotificationRead } from '@/server/notifications'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeOwnerMutation(request)
  if (authorization.error) return authorization.error
  const { id } = await context.params
  return (await markNotificationRead(id))
    ? NextResponse.json({ read: true })
    : NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
}
