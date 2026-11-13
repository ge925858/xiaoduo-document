import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { authorizeOwnerMutation } from '@/lib/studio-request'
import { trashArticle } from '@/server/articles'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeOwnerMutation(request)
  if (authorization.error) return authorization.error
  const { id } = await context.params
  const trashed = await trashArticle(id, {
    id: authorization.session.user.id,
    name: authorization.session.user.name,
    role: 'owner',
  })
  if (trashed) {
    revalidatePath('/library')
    revalidatePath('/')
  }
  return trashed
    ? NextResponse.json({ trashed: true })
    : NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
}
