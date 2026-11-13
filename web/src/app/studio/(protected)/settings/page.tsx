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
    <section>
      <p className="eyebrow">Site profile</p>
      <h1>站点资料</h1>
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
      <section className="export-panel">
        <h2>整站导出</h2>
        <p>下载分类顺序、Markdown 正文、状态、版本和协作元数据。</p>
        <a href="/api/studio/export" download>
          下载整站导出 ZIP
        </a>
      </section>
    </section>
  )
}
