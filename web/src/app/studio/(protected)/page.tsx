import { redirect } from 'next/navigation'
import { ArticleDashboard } from '@/components/studio/article-dashboard'
import { requireOwner } from '@/lib/server-session'
import { listArticleDrafts } from '@/server/articles'
import { listCategories } from '@/server/categories'

export default async function StudioPage() {
  const session = await requireOwner()
  if (!session) redirect('/studio')

  return (
    <section>
      <p className="eyebrow">Studio</p>
      <h1>写作台</h1>
      <ArticleDashboard
        categories={await listCategories()}
        articles={await listArticleDrafts()}
      />
    </section>
  )
}
