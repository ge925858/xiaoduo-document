import { NextResponse } from 'next/server'
import { authorizeStudioMutation } from '@/lib/studio-request'
import { studioActorFromUser } from '@/server/article-access'
import { restoreTrashArticleForActor } from '@/server/articles'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeStudioMutation(request)
  if (authorization.error) return authorization.error
  const { id } = await context.params
  const actor = studioActorFromUser(authorization.session.user)
  return (await restoreTrashArticleForActor(id, {
    id: actor.id,
    name: authorization.session.user.name,
    role: actor.role,
  }))
    ? NextResponse.json({ restored: true })
    : NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
}
