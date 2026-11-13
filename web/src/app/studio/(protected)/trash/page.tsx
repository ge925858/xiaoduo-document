import { redirect } from 'next/navigation'
import { TrashManager } from '@/components/studio/trash-manager'
import { requireOwner } from '@/lib/server-session'
import { listTrash } from '@/server/articles'

export default async function TrashPage() {
  const session = await requireOwner()
  if (!session) redirect('/studio')
  return (
    <section>
      <p className="eyebrow">Recycle bin</p>
      <h1>回收站</h1>
      <p>章节保留 30 天；恢复后需要重新发布才会公开。</p>
      <TrashManager initialItems={await listTrash()} />
    </section>
  )
}
