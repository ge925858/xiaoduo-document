import { redirect } from 'next/navigation'
import { CollaborationManager } from '@/components/studio/collaboration-manager'
import { requireOwner } from '@/lib/server-session'
import { listArticleDrafts } from '@/server/articles'
import {
  listApplications,
  listInvites,
} from '@/server/collaboration'

export default async function CollaborationPage() {
  const session = await requireOwner()
  if (!session) redirect('/studio')
  return (
    <section>
      <p className="eyebrow">Collaboration</p>
      <h1>协作管理</h1>
      <CollaborationManager
        applications={await listApplications()}
        invites={await listInvites()}
        articles={await listArticleDrafts()}
      />
    </section>
  )
}
