import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { authorizeOwnerMutation } from '@/lib/studio-request'
import { getArticleDraft, publishArticle } from '@/server/articles'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeOwnerMutation(request)
  if (authorization.error) return authorization.error
  const { id } = await context.params
  const article = await getArticleDraft(id)
  if (!article) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  const result = await publishArticle(id, {
    id: authorization.session.user.id,
    name: authorization.session.user.name,
    role: 'owner',
  })
  if (result !== 'published') {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  revalidatePath('/')
  revalidatePath('/library')
  revalidatePath(`/library/${article.categorySlug}`)
  revalidatePath(`/library/${article.categorySlug}/${article.path}`)
  return NextResponse.json({ result })
}
