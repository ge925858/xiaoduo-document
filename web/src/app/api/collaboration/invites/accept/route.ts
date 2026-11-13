import { NextResponse } from 'next/server'
import { z } from 'zod'
import { activateInvitation } from '@/server/collaboration'

const schema = z.object({
  token: z.string().min(1).max(256),
  displayName: z.string().trim().min(1).max(120),
  password: z.string().min(8).max(128),
})

export async function POST(request: Request) {
  const appOrigin = process.env.APP_ORIGIN ?? 'http://127.0.0.1:3100'
  if (request.headers.get('origin') !== appOrigin) {
    return NextResponse.json({ error: 'INVALID_ORIGIN' }, { status: 403 })
  }
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_ACTIVATION' },
      { status: 400 },
    )
  }

  try {
    const result = await activateInvitation(parsed.data)
    if (result.status === 'activated') {
      return NextResponse.json(result, { status: 201 })
    }
    if (result.status === 'already-activated') {
      return NextResponse.json(result, { status: 409 })
    }
    if (result.status === 'expired') {
      return NextResponse.json(result, { status: 410 })
    }
    return NextResponse.json(result, { status: 403 })
  } catch (error) {
    if (error instanceof Error && error.message === 'INVITE_NOT_FOUND') {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }
    console.error(
      JSON.stringify({
        event: 'collaboration_invitation_activation_failed',
        error: error instanceof Error ? error.message : String(error),
      }),
    )
    return NextResponse.json(
      { error: 'ACTIVATION_FAILED' },
      { status: 500 },
    )
  }
}
