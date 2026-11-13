import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authorizeOwnerMutation } from '@/lib/studio-request'
import { createArticleDraft } from '@/server/articles'

const createSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().trim().max(300).optional().default('无标题章节'),
})

export async function POST(request: Request) {
  const authorization = await authorizeOwnerMutation(request)
  if (authorization.error) return authorization.error
  const parsed = createSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_ARTICLE' }, { status: 400 })
  }
  try {
    return NextResponse.json(
      { article: await createArticleDraft(parsed.data) },
      { status: 201 },
    )
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNKNOWN'
    return NextResponse.json({ error: code }, { status: 409 })
  }
}
