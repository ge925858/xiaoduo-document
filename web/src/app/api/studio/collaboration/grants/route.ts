import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authorizeOwnerMutation } from '@/lib/studio-request'
import {
  grantArticle,
  revokeArticleGrant,
} from '@/server/article-access'

const schema = z.object({
  userId: z.string().min(1).max(36),
  articleId: z.string().min(1).max(36),
})

async function parseInput(request: Request) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) {
    return {
      error: NextResponse.json(
        { error: 'INVALID_GRANT' },
        { status: 400 },
      ),
    }
  }
  return { data: parsed.data }
}

export async function POST(request: Request) {
  const authorization = await authorizeOwnerMutation(request)
  if (authorization.error) return authorization.error
  const input = await parseInput(request)
  if (input.error) return input.error
  try {
    await grantArticle(input.data)
    return NextResponse.json({ saved: true }, { status: 201 })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNKNOWN'
    return NextResponse.json({ error: code }, { status: 404 })
  }
}

export async function DELETE(request: Request) {
  const authorization = await authorizeOwnerMutation(request)
  if (authorization.error) return authorization.error
  const input = await parseInput(request)
  if (input.error) return input.error
  await revokeArticleGrant(input.data)
  return NextResponse.json({ revoked: true })
}
