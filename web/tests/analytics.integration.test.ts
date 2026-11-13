import { beforeEach, describe, expect, it } from 'vitest'
import {
  getAnalyticsReport,
  getArticleViewCount,
  purgeAnalyticsEvents,
  recordArticleView,
  resolveTrustedClientIp,
} from '@/server/analytics'
import { createTestConnection, resetTestDatabase } from './test-db'

const visitor = {
  articleId: 'article-1',
  ip: '120.24.78.68',
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36',
  referrer: 'https://www.google.com/search?q=zhijian',
  isOwner: false,
}

describe('article analytics', () => {
  beforeEach(async () => {
    await resetTestDatabase()
    const connection = await createTestConnection()
    try {
      await connection.query(
        `INSERT INTO category (id, title, slug, position)
         VALUES ('category-1', '注意力与写作', 'attention-and-writing', 1)`,
      )
      await connection.query(
        `INSERT INTO article (
          id, category_id, title, path, position, markdown, plain_text,
          revision, publication_state, created_at, updated_at
        ) VALUES (
          'article-1', 'category-1', '写作不是归档', '写作不是归档', 1,
          '正文', '正文', 1, 'published', NOW(3), NOW(3)
        )`,
      )
      await connection.query(
        `INSERT INTO article_version (
          id, article_id, kind, title, path, markdown, plain_text,
          author_id, author_name, author_role, created_at
        ) VALUES (
          'version-1', 'article-1', 'published', '写作不是归档',
          '写作不是归档', '正文', '正文', 'owner-1', '小多', 'owner', NOW(3)
        )`,
      )
    } finally {
      await connection.end()
    }
  })

  it('deduplicates real visits, excludes owner and bots, and resolves location', async () => {
    expect(
      await recordArticleView({ ...visitor, isOwner: true }),
    ).toMatchObject({ counted: false, reason: 'owner' })
    expect(
      await recordArticleView({
        ...visitor,
        userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
      }),
    ).toMatchObject({ counted: false, reason: 'bot' })

    expect(await recordArticleView(visitor)).toEqual({ counted: true })
    expect(await recordArticleView(visitor)).toMatchObject({
      counted: false,
      reason: 'duplicate',
    })
    expect(await getArticleViewCount('article-1')).toBe(1)

    const report = await getAnalyticsReport()
    expect(report).toMatchObject({
      totalViews: 1,
      uniqueVisitors: 1,
      recentVisits: [
        expect.objectContaining({
          articleTitle: '写作不是归档',
          ip: '120.24.78.68',
          referrerDomain: 'google.com',
        }),
      ],
    })
    expect(report.recentVisits[0].location).toContain('广东')
    expect(report.articleRanking[0]).toMatchObject({
      articleTitle: '写作不是归档',
      views: 1,
    })
  })

  it('purges raw events after 30 days while keeping aggregate metrics', async () => {
    await recordArticleView(visitor)
    const connection = await createTestConnection()
    try {
      await connection.query(
        `UPDATE article_view_event
         SET visited_at = DATE_SUB(NOW(3), INTERVAL 31 DAY)`,
      )
    } finally {
      await connection.end()
    }

    expect(await purgeAnalyticsEvents()).toBe(1)
    expect(await getArticleViewCount('article-1')).toBe(1)
    expect((await getAnalyticsReport()).recentVisits).toEqual([])
  })

  it('uses x-real-ip only when the app explicitly trusts its proxy', () => {
    const previous = process.env.TRUST_PROXY
    const headers = new Headers({
      'x-forwarded-for': '198.51.100.20',
      'x-real-ip': '120.24.78.68',
    })
    try {
      process.env.TRUST_PROXY = 'false'
      expect(resolveTrustedClientIp(headers)).toBe('unknown')
      process.env.TRUST_PROXY = 'true'
      expect(resolveTrustedClientIp(headers)).toBe('120.24.78.68')
    } finally {
      if (previous === undefined) delete process.env.TRUST_PROXY
      else process.env.TRUST_PROXY = previous
    }
  })
})
