import { eq } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'
import { ProfileForm } from '@/components/studio/profile-form'
import { db } from '@/db/client'
import { siteProfile } from '@/db/schema'
import { requireOwner } from '@/lib/server-session'

export default async function StudioSettingsPage() {
  const session = await requireOwner()
  if (!session) redirect('/studio')

  const [profile] = await db
    .select()
    .from(siteProfile)
    .where(eq(siteProfile.id, 'primary'))
    .limit(1)

  if (!profile) notFound()

  return (
    <ProfileForm
      initial={{
        authorName: profile.authorName,
        avatarUrl: profile.avatarUrl ?? '',
        roleTitle: profile.roleTitle,
        intro: profile.intro,
        nowText: profile.nowText,
        location: profile.location,
        email: profile.email,
      }}
    />
  )
}
