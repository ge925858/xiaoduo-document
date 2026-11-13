import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { authorizeOwnerMutation } from '@/lib/studio-request'
import { permanentlyDeleteArticle } from '@/server/articles'

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeOwnerMutation(request)
  if (authorization.error) return authorization.error
  const { id } = await context.params
  const deleted = await permanentlyDeleteArticle(id)
  if (deleted) {
    revalidatePath('/library')
    revalidatePath('/')
  }
  return deleted
    ? NextResponse.json({ deleted: true })
    : NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
}
