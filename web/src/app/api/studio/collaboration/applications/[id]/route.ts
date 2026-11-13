import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authorizeOwnerMutation } from '@/lib/studio-request'
import {
  approveApplication,
  rejectApplication,
} from '@/server/collaboration'

const schema = z.object({
  decision: z.union([z.literal('approve'), z.literal('reject')]),
})

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeOwnerMutation(request)
  if (authorization.error) return authorization.error
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_DECISION' }, { status: 400 })
  }
  const { id } = await context.params
  if (parsed.data.decision === 'approve') {
    const invite = await approveApplication(id)
    return invite
      ? NextResponse.json({ invite }, { status: 201 })
      : NextResponse.json({ error: 'NOT_PENDING' }, { status: 409 })
  }
  return (await rejectApplication(id))
    ? NextResponse.json({ rejected: true })
    : NextResponse.json({ error: 'NOT_PENDING' }, { status: 409 })
}
