import { redirect } from 'next/navigation'
import { ArticleDashboard } from '@/components/studio/article-dashboard'
import { requireStudioSession } from '@/lib/server-session'
import { listArticleDrafts } from '@/server/articles'
import { listCategories } from '@/server/categories'

export default async function StudioPage() {
  const session = await requireStudioSession()
  if (!session) redirect('/studio/login')

  if (session.user.role !== 'owner') {
    return (
      <section>
        <p className="eyebrow">Studio</p>
        <h1>协作文章</h1>
        <p>当前账号已激活，文章授权将在下一步加载。</p>
      </section>
    )
  }

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
