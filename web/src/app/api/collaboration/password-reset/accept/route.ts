import { NextResponse } from 'next/server'
import { z } from 'zod'
import { resetCollaboratorPassword } from '@/server/collaboration'

const schema = z.object({
  token: z.string().min(1).max(256),
  password: z.string().min(8).max(128),
})

export async function POST(request: Request) {
  const appOrigin = process.env.APP_ORIGIN ?? 'http://127.0.0.1:3100'
  if (request.headers.get('origin') !== appOrigin) {
    return NextResponse.json({ error: 'INVALID_ORIGIN' }, { status: 403 })
  }
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_RESET' }, { status: 400 })
  }
  const result = await resetCollaboratorPassword(
    parsed.data.token,
    parsed.data.password,
  )
  const status =
    result === 'reset'
      ? 200
      : result === 'used'
        ? 409
        : result === 'expired'
          ? 410
          : 404
  return NextResponse.json({ result }, { status })
}
