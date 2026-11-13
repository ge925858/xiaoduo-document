import { redirect } from 'next/navigation'
import { ArticleDashboard } from '@/components/studio/article-dashboard'
import { requireStudioSession } from '@/lib/server-session'
import {
  listAccessibleArticles,
  listAccessibleCategories,
  studioActorFromUser,
} from '@/server/article-access'

export default async function StudioPage() {
  const session = await requireStudioSession()
  if (!session) redirect('/studio/login')

  const actor = studioActorFromUser(session.user)
  const isOwner = actor.role === 'owner'

  return (
    <section>
      <p className="eyebrow">Studio</p>
      <h1>{isOwner ? '写作台' : '协作文章'}</h1>
      <ArticleDashboard
        categories={await listAccessibleCategories(actor)}
        articles={await listAccessibleArticles(actor)}
        canManage={isOwner}
      />
    </section>
  )
}
