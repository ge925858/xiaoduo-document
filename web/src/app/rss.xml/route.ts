import {
  buildRssXml,
  listReaderDiscoveryEntries,
} from '@/server/reader-discovery'
import { getPublicSiteProfile } from '@/lib/public-library'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [entries, profile] = await Promise.all([
    listReaderDiscoveryEntries(),
    getPublicSiteProfile(),
  ])
  const siteUrl = process.env.APP_ORIGIN ?? 'http://127.0.0.1:3100'
  return new Response(
    buildRssXml(entries, siteUrl, profile?.authorName ?? '知笺'),
    {
      headers: {
        'content-type': 'application/rss+xml; charset=utf-8',
        'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    },
  )
}
