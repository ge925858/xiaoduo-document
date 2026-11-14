import { NextResponse } from 'next/server'
import { studioActorFromUser } from '@/server/article-access'
import { deleteArticleVersion } from '@/server/articles'
import { authorizeArticleMutation } from '@/lib/studio-request'

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; versionId: string }> },
) {
  const { id, versionId } = await context.params
  const authorization = await authorizeArticleMutation(request, id)
  if (authorization.error) return authorization.error

  const actor = studioActorFromUser(authorization.session.user)
  const result = await deleteArticleVersion(id, versionId, actor)
  if (result === 'deleted') {
    return NextResponse.json({ deleted: true })
  }
  if (result === 'published') {
    return NextResponse.json(
      { error: 'VERSION_NOT_DELETABLE' },
      { status: 409 },
    )
  }
  if (result === 'forbidden') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
}
