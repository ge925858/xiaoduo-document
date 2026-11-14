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
    <TrashManager
      initialItems={await listTrashForActor({
        ...actor,
        name: session.user.name,
      })}
      canDelete={actor.role === 'owner'}
      isOwner={actor.role === 'owner'}
    />
  )
}
