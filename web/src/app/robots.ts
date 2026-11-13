import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_ORIGIN ?? 'http://127.0.0.1:3100'
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/studio', '/api'] }],
    sitemap: `${base}/sitemap.xml`,
  }
}
