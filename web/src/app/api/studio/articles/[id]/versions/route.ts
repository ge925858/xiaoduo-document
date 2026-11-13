import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authorizeOwnerMutation } from '@/lib/studio-request'
import { saveManualVersion } from '@/server/articles'

const versionSchema = z.object({
  label: z.string().trim().max(200).optional().default(''),
})

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeOwnerMutation(request)
  if (authorization.error) return authorization.error
  const parsed = versionSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_VERSION' }, { status: 400 })
  }
  const { id } = await context.params
  try {
    const version = await saveManualVersion(id, {
      label: parsed.data.label,
      actor: {
        id: authorization.session.user.id,
        name: authorization.session.user.name,
        role: 'owner',
      },
    })
    return NextResponse.json({ version }, { status: 201 })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNKNOWN'
    return NextResponse.json({ error: code }, { status: 404 })
  }
}
