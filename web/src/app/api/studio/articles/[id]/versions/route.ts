import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authorizeArticleMutation } from '@/lib/studio-request'
import { studioActorFromUser } from '@/server/article-access'
import { saveManualVersion } from '@/server/articles'

const versionSchema = z.object({
  label: z.string().trim().max(200).optional().default(''),
})

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const authorization = await authorizeArticleMutation(request, id)
  if (authorization.error) return authorization.error
  const parsed = versionSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_VERSION' }, { status: 400 })
  }
  const actor = studioActorFromUser(authorization.session.user)
  try {
    const version = await saveManualVersion(id, {
      label: parsed.data.label,
      actor: {
        id: actor.id,
        name: authorization.session.user.name,
        role: actor.role,
      },
    })
    return NextResponse.json({ version }, { status: 201 })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNKNOWN'
    return NextResponse.json({ error: code }, { status: 404 })
  }
}
