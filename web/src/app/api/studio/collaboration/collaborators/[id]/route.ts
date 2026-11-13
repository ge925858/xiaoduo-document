import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authorizeOwnerMutation } from '@/lib/studio-request'
import { setCollaboratorStatus } from '@/server/collaboration'

const schema = z.object({
  status: z.enum(['active', 'suspended']),
})

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeOwnerMutation(request)
  if (authorization.error) return authorization.error
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_COLLABORATOR_STATUS' },
      { status: 400 },
    )
  }
  const { id } = await context.params
  return (await setCollaboratorStatus(id, parsed.data.status))
    ? NextResponse.json({ updated: true })
    : NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
}
