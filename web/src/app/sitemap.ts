import type { MetadataRoute } from 'next'
import { listReaderDiscoveryEntries } from '@/server/reader-discovery'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_ORIGIN ?? 'http://127.0.0.1:3100'
  const entries = await listReaderDiscoveryEntries()
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${base}/library`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...entries.map((entry) => ({
      url: `${base}/library/${entry.categorySlug}/${entry.path}`,
      lastModified: new Date(entry.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
