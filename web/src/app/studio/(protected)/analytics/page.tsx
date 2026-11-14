import { redirect } from 'next/navigation'
import { AnalyticsReport as AnalyticsReportView } from '@/components/studio/analytics-report'
import { requireOwner } from '@/lib/server-session'
import { getAnalyticsReport } from '@/server/analytics'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const session = await requireOwner()
  if (!session) redirect('/studio')
  const report = await getAnalyticsReport()
  return <AnalyticsReportView report={report} />
}
