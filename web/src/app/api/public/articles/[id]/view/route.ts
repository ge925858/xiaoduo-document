import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from '@/lib/server-session'
import {
  recordArticleView,
  resolveTrustedClientIp,
} from '@/server/analytics'

const schema = z.object({
  referrer: z.string().max(2048).optional().default(''),
})

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const appOrigin = process.env.APP_ORIGIN ?? 'http://127.0.0.1:3100'
  if (request.headers.get('origin') !== appOrigin) {
    return NextResponse.json({ error: 'INVALID_ORIGIN' }, { status: 403 })
  }
  if (
    request.headers.get('x-middleware-prefetch') === '1' ||
    request.headers.get('sec-purpose')?.includes('prefetch') ||
    request.headers.get('purpose')?.includes('prefetch')
  ) {
    return NextResponse.json({ counted: false, reason: 'prefetch' })
  }
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_VIEW' }, { status: 400 })
  }
  const { id } = await context.params
  const session = await getServerSession()
  const result = await recordArticleView({
    articleId: id,
    ip: resolveTrustedClientIp(request.headers),
    userAgent: request.headers.get('user-agent') ?? '',
    referrer: parsed.data.referrer,
    isOwner: session?.user.role === 'owner',
  })
  return NextResponse.json(result)
}
