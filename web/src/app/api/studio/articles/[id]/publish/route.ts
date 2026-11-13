import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { authorizeArticleMutation } from '@/lib/studio-request'
import { studioActorFromUser } from '@/server/article-access'
import {
  getLatestPublishedLocation,
  publishArticle,
} from '@/server/articles'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const authorization = await authorizeArticleMutation(request, id)
  if (authorization.error) return authorization.error
  const { article } = authorization
  const actor = studioActorFromUser(authorization.session.user)
  const previousPublished = await getLatestPublishedLocation(id)

  const result = await publishArticle(id, {
    id: actor.id,
    name: authorization.session.user.name,
    role: actor.role,
  })
  if (result !== 'published') {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  revalidatePath('/')
  revalidatePath('/library')
  if (previousPublished) {
    revalidatePath(
      `/library/${previousPublished.categorySlug}/${previousPublished.path}`,
    )
  }
  revalidatePath(`/library/${article.categorySlug}`)
  revalidatePath(`/library/${article.categorySlug}/${article.path}`)
  return NextResponse.json({ result })
}
