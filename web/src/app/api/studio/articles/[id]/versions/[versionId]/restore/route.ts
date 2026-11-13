import { NextResponse } from 'next/server'
import { authorizeOwnerMutation } from '@/lib/studio-request'
import { restoreArticleVersion } from '@/server/articles'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; versionId: string }> },
) {
  const authorization = await authorizeOwnerMutation(request)
  if (authorization.error) return authorization.error
  const { id, versionId } = await context.params
  const result = await restoreArticleVersion(id, versionId)
  const status =
    result === 'saved' ? 200 : result === 'conflict' ? 409 : 404
  return NextResponse.json({ result }, { status })
}
