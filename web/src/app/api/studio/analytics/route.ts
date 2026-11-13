import { NextResponse } from 'next/server'
import { requireOwner } from '@/lib/server-session'
import { getAnalyticsReport } from '@/server/analytics'

export async function GET() {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  return NextResponse.json({ report: await getAnalyticsReport() })
}
