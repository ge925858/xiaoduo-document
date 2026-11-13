import { headers } from 'next/headers'
import { auth } from './auth'

export async function getServerSession() {
  return auth.api.getSession({
    headers: await headers(),
  })
}

export async function requireOwner() {
  const session = await getServerSession()
  if (!session || session.user.role !== 'owner') return null
  if (session.user.status !== 'active') return null
  return session
}

export async function requireStudioSession() {
  const session = await getServerSession()
  if (!session || session.user.status !== 'active') return null
  return session
}
