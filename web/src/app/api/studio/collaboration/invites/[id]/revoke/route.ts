import { NextResponse } from 'next/server'
import { authorizeOwnerMutation } from '@/lib/studio-request'
import { revokePendingInvite } from '@/server/collaboration'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeOwnerMutation(request)
  if (authorization.error) return authorization.error

  const { id } = await context.params
  const result = await revokePendingInvite(id)
  if (result === 'not-found') {
    return NextResponse.json({ error: 'INVITE_NOT_FOUND' }, { status: 404 })
  }
  if (result === 'not-pending') {
    return NextResponse.json(
      { error: 'INVITE_NOT_PENDING' },
      { status: 409 },
    )
  }
  return NextResponse.json({ revoked: true })
}
