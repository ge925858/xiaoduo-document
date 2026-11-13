import { NextResponse } from 'next/server'
import { authorizeOwnerMutation } from '@/lib/studio-request'
import { restoreTrashArticle } from '@/server/articles'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeOwnerMutation(request)
  if (authorization.error) return authorization.error
  const { id } = await context.params
  return (await restoreTrashArticle(id))
    ? NextResponse.json({ restored: true })
    : NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
}
