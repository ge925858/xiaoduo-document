import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { authorizeArticleMutation } from '@/lib/studio-request'
import { studioActorFromUser } from '@/server/article-access'
import { trashArticle } from '@/server/articles'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const authorization = await authorizeArticleMutation(request, id)
  if (authorization.error) return authorization.error
  const actor = studioActorFromUser(authorization.session.user)
  const trashed = await trashArticle(id, {
    id: actor.id,
    name: authorization.session.user.name,
    role: actor.role,
  })
  if (trashed) {
    revalidatePath('/library')
    revalidatePath('/')
  }
  return trashed
    ? NextResponse.json({ trashed: true })
    : NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
}
