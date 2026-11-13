import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authorizeOwnerMutation } from '@/lib/studio-request'
import { deleteCategory, updateCategory } from '@/server/categories'

const categorySchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
})

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeOwnerMutation(request)
  if (authorization.error) return authorization.error
  const parsed = categorySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_CATEGORY' }, { status: 400 })
  }
  try {
    const { id } = await context.params
    const updated = await updateCategory(id, parsed.data)
    return updated
      ? NextResponse.json({ category: updated })
      : NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNKNOWN'
    return NextResponse.json({ error: code }, { status: 409 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeOwnerMutation(request)
  if (authorization.error) return authorization.error
  const { id } = await context.params
  const deleted = await deleteCategory(id)
  return deleted
    ? NextResponse.json({ deleted: true })
    : NextResponse.json({ error: 'CATEGORY_NOT_EMPTY' }, { status: 409 })
}
