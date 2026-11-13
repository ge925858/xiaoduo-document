import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authorizeOwnerMutation } from '@/lib/studio-request'
import { saveArticleDraft } from '@/server/articles'

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
  const authorization = await authorizeOwnerMutation(request)
  if (authorization.error) return authorization.error
  const parsed = saveSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_DRAFT' }, { status: 400 })
  }
  const { id } = await context.params
  const result = await saveArticleDraft(id, parsed.data)
  const status =
    result === 'saved' ? 200 : result === 'conflict' ? 409 : 404
  return NextResponse.json({ result }, { status })
}
