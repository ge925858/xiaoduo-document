import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authorizeOwnerMutation } from '@/lib/studio-request'
import { requireOwner } from '@/lib/server-session'
import { createCategory, listCategories } from '@/server/categories'

const categorySchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
})

export async function GET() {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  return NextResponse.json({ categories: await listCategories() })
}

export async function POST(request: Request) {
  const authorization = await authorizeOwnerMutation(request)
  if (authorization.error) return authorization.error

  const parsed = categorySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_CATEGORY' }, { status: 400 })
  }
  try {
    return NextResponse.json(
      { category: await createCategory(parsed.data) },
      { status: 201 },
    )
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNKNOWN'
    return NextResponse.json({ error: code }, { status: 409 })
  }
}
