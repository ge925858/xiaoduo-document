import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authorizeArticleMutation } from '@/lib/studio-request'
import { saveArticleDraft } from '@/server/articles'
import {
  getAccessibleArticle,
  studioActorFromUser,
} from '@/server/article-access'

const saveSchema = z.object({
  title: z.string().trim().max(300),
  categoryId: z.string().min(1),
  contentJson: z.object({ type: z.literal('doc') }).passthrough(),
  markdown: z.string(),
  plainText: z.string(),
  expectedRevision: z.number().int().positive(),
})

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const authorization = await authorizeArticleMutation(request, id)
  if (authorization.error) return authorization.error
  const parsed = saveSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_DRAFT' }, { status: 400 })
  }
  if (
    authorization.session.user.role === 'collaborator' &&
    parsed.data.categoryId !== authorization.article.categoryId
  ) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const result = await saveArticleDraft(id, parsed.data)
  if (result === 'conflict') {
    const current = await getAccessibleArticle(
      studioActorFromUser(authorization.session.user),
      id,
    )
    return NextResponse.json({ result, current }, { status: 409 })
  }
  const status =
    result === 'saved' ? 200 : 404
  return NextResponse.json({ result }, { status })
}
