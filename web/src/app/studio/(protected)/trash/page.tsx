import { redirect } from 'next/navigation'
import { TrashManager } from '@/components/studio/trash-manager'
import { requireStudioSession } from '@/lib/server-session'
import { studioActorFromUser } from '@/server/article-access'
import { listTrashForActor } from '@/server/articles'

export default async function TrashPage() {
  const session = await requireStudioSession()
  if (!session) redirect('/studio/login')
  const actor = studioActorFromUser(session.user)
  return (
    <section>
      <p className="eyebrow">Recycle bin</p>
      <h1>回收站</h1>
      <p>章节保留 30 天；恢复后需要重新发布才会公开。</p>
      <TrashManager
        initialItems={await listTrashForActor({
          ...actor,
          name: session.user.name,
        })}
        canDelete={actor.role === 'owner'}
      />
    </section>
  )
}
