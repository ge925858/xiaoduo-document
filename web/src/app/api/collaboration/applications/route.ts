import { NextResponse } from 'next/server'
import { z } from 'zod'
import { submitApplication } from '@/server/collaboration'

const schema = z.object({
  articleId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  note: z.string().trim().max(2000),
})

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_APPLICATION' }, { status: 400 })
  }
  try {
    const result = await submitApplication(parsed.data)
    return result === 'duplicate'
      ? NextResponse.json({ error: 'DUPLICATE_APPLICATION' }, { status: 409 })
      : NextResponse.json({ application: result }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'ARTICLE_NOT_FOUND') {
      return NextResponse.json({ error: 'ARTICLE_NOT_FOUND' }, { status: 404 })
    }
    console.error(
      JSON.stringify({
        event: 'collaboration_application_failed',
        error: error instanceof Error ? error.message : String(error),
      }),
    )
    return NextResponse.json(
      { error: 'APPLICATION_FAILED' },
      { status: 500 },
    )
  }
}
