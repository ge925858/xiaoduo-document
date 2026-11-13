import { pool } from '@/db/client'
import {
  aggregateAnalyticsMetrics,
  purgeAnalyticsEvents,
} from '@/server/analytics'
import { purgeExpiredTrash } from '@/server/articles'

try {
  const trash = await purgeExpiredTrash()
  const analytics = await aggregateAnalyticsMetrics()
  const deletedEvents = await purgeAnalyticsEvents()
  console.log(
    JSON.stringify({
      event: 'cron_completed',
      trashDeleted: trash,
      analyticsGroups: analytics.groups,
      analyticsEvents: analytics.events,
      deletedEvents,
      at: new Date().toISOString(),
    }),
  )
} catch (error) {
  console.error(
    JSON.stringify({
      event: 'cron_failed',
      error: error instanceof Error ? error.message : String(error),
      at: new Date().toISOString(),
    }),
  )
  process.exitCode = 1
} finally {
  await pool.end()
}
