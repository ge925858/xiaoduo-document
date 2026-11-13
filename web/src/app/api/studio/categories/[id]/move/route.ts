import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authorizeOwnerMutation } from '@/lib/studio-request'
import { moveCategory } from '@/server/categories'

const moveSchema = z.object({ direction: z.union([z.literal(-1), z.literal(1)]) })

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeOwnerMutation(request)
  if (authorization.error) return authorization.error
  const parsed = moveSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_DIRECTION' }, { status: 400 })
  }
  const { id } = await context.params
  return (await moveCategory(id, parsed.data.direction))
    ? NextResponse.json({ moved: true })
    : NextResponse.json({ error: 'CANNOT_MOVE' }, { status: 409 })
}
