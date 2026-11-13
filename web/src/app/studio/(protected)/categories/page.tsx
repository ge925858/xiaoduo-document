import { redirect } from 'next/navigation'
import { CategoryManager } from '@/components/studio/category-manager'
import { requireOwner } from '@/lib/server-session'
import { listCategories } from '@/server/categories'

export default async function CategoriesPage() {
  const session = await requireOwner()
  if (!session) redirect('/studio')

  return (
    <section>
      <p className="eyebrow">Library structure</p>
      <h1>分类管理</h1>
      <p>分类固定为目录第一层，章节顺序和分类顺序都由手动调整。</p>
      <CategoryManager initialCategories={await listCategories()} />
    </section>
  )
}
