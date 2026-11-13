import { NextResponse } from 'next/server'
import { authorizeOwnerMutation } from '@/lib/studio-request'
import { createCollaboratorPasswordReset } from '@/server/collaboration'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeOwnerMutation(request)
  if (authorization.error) return authorization.error
  const { id } = await context.params
  try {
    return NextResponse.json(
      { reset: await createCollaboratorPasswordReset(id) },
      { status: 201 },
    )
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNKNOWN'
    return NextResponse.json({ error: code }, { status: 404 })
  }
}
