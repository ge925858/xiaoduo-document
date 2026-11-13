import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/studio/login-form'
import { getServerSession } from '@/lib/server-session'

export default async function StudioLoginPage() {
  const session = await getServerSession()
  if (session) redirect('/studio')

  return (
    <main className="studio-login">
      <p className="eyebrow">Private studio</p>
      <h1>进入写作台</h1>
      <LoginForm />
    </main>
  )
}
