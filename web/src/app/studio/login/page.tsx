import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/studio/login-form'
import { getServerSession } from '@/lib/server-session'

export default async function StudioLoginPage() {
  const session = await getServerSession()
  if (session) redirect('/studio')

  return <LoginForm />
}
