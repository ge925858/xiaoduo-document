import { createHash, randomUUID } from 'node:crypto'
import { isIP } from 'node:net'
import { and, desc, eq, gt, lt, sql } from 'drizzle-orm'
import { IP2Region } from 'ip2region/node'
import { db } from '@/db/client'
import {
  article,
  articleViewEvent,
  dailyArticleMetric,
} from '@/db/schema'

const SHANGHAI_TIME_ZONE = 'Asia/Shanghai'
const DEDUPE_WINDOW_MS = 30 * 60 * 1000
const RAW_RETENTION_DAYS = 30
const BOT_PATTERN =
  /bot|crawler|spider|preview|slack|discord|facebookexternalhit|headless/i

let ipResolver: IP2Region | null | undefined

export interface AnalyticsTrendPoint {
  date: string
  views: number
  uniqueVisitors: number
}

export interface AnalyticsReport {
  totalViews: number
  uniqueVisitors: number
  sevenDayTrend: AnalyticsTrendPoint[]
  thirtyDayTrend: AnalyticsTrendPoint[]
  articleRanking: Array<{
    articleId: string
    articleTitle: string
    views: number
    uniqueVisitors: number
    lastVisitedAt: Date | null
  }>
  recentVisits: Array<{
    id: string
    articleId: string
    articleTitle: string
    ip: string
    location: string
    referrerDomain: string
    visitedAt: Date
  }>
}

function shanghaiDate(value = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SHANGHAI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function shanghaiDayBounds(day: string) {
  const start = new Date(`${day}T00:00:00+08:00`)
  return {
    start,
    end: new Date(start.getTime() + 24 * 60 * 60 * 1000),
  }
}

function recentDayList(count: number, now = new Date()) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getTime() - (count - 1 - index) * 86400000)
    return shanghaiDate(date)
  })
}

function referrerDomain(referrer: string): string {
  if (!referrer) return '直接访问'
  try {
    return new URL(referrer).hostname.replace(/^www\./, '')
  } catch {
    return '直接访问'
  }
}

function visitorHash(
  ip: string,
  userAgent: string,
  day: string,
): string {
  const salt =
    process.env.ANALYTICS_HASH_SECRET ??
    'zhijian-development-analytics-salt'
  return createHash('sha256')
    .update(`${salt}:${day}:${ip}:${userAgent}`)
    .digest('hex')
}

export function resolveIpLocation(ip: string): string {
  if (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  ) {
    return '本地网络'
  }
  try {
    ipResolver ??= new IP2Region()
    const result = ipResolver.lookup(ip)
    if (!result) return '未知'
    const province = result.subdivisions?.[0]?.name
    const city = result.city?.name
    return [province, city].filter(Boolean).join(' ') || result.country?.name || '未知'
  } catch {
    return '未知'
  }
}

export function resolveTrustedClientIp(headers: Headers): string {
  if (process.env.TRUST_PROXY !== 'true') return 'unknown'
  return headers.get('x-real-ip')?.trim() || 'unknown'
}

export async function recordArticleView(input: {
  articleId: string
  ip: string
  userAgent: string
  referrer: string
  isOwner: boolean
}): Promise<{ counted: boolean; reason?: string }> {
  if (input.isOwner) return { counted: false, reason: 'owner' }
  if (!input.userAgent || BOT_PATTERN.test(input.userAgent)) {
    return { counted: false, reason: 'bot' }
  }
  if (!isIP(input.ip)) return { counted: false, reason: 'invalid-ip' }
  const [target] = await db
    .select({ id: article.id })
    .from(article)
    .where(
      and(
        eq(article.id, input.articleId),
        eq(article.publicationState, 'published'),
        sql`${article.trashedAt} IS NULL`,
      ),
    )
    .limit(1)
  if (!target) return { counted: false, reason: 'not-found' }

  const now = new Date()
  const [duplicate] = await db
    .select({ id: articleViewEvent.id })
    .from(articleViewEvent)
    .where(
      and(
        eq(articleViewEvent.articleId, input.articleId),
        eq(articleViewEvent.visitorIp, input.ip),
        gt(
          articleViewEvent.visitedAt,
          new Date(now.getTime() - DEDUPE_WINDOW_MS),
        ),
      ),
    )
    .limit(1)
  if (duplicate) return { counted: false, reason: 'duplicate' }

  const day = shanghaiDate(now)
  const bounds = shanghaiDayBounds(day)
  const hash = visitorHash(input.ip, input.userAgent, day)
  const [sameVisitor] = await db
    .select({ id: articleViewEvent.id })
    .from(articleViewEvent)
    .where(
      and(
        eq(articleViewEvent.articleId, input.articleId),
        eq(articleViewEvent.visitorHash, hash),
        gt(articleViewEvent.visitedAt, bounds.start),
        lt(articleViewEvent.visitedAt, bounds.end),
      ),
    )
    .limit(1)

  await db.transaction(async (transaction) => {
    await transaction.insert(articleViewEvent).values({
      id: randomUUID(),
      articleId: input.articleId,
      visitorIp: input.ip,
      visitorHash: hash,
      location: resolveIpLocation(input.ip),
      referrerDomain: referrerDomain(input.referrer),
      visitedAt: now,
    })
    await transaction
      .insert(dailyArticleMetric)
      .values({
        articleId: input.articleId,
        metricDate: day,
        views: 1,
        uniqueVisitors: sameVisitor ? 0 : 1,
        lastVisitedAt: now,
      })
      .onDuplicateKeyUpdate({
        set: {
          views: sql`${dailyArticleMetric.views} + 1`,
          uniqueVisitors: sql`${dailyArticleMetric.uniqueVisitors} + ${
            sameVisitor ? 0 : 1
          }`,
          lastVisitedAt: now,
        },
      })
  })
  return { counted: true }
}

export async function getArticleViewCount(articleId: string) {
  const [result] = await db
    .select({ views: sql<number>`COALESCE(SUM(${dailyArticleMetric.views}), 0)` })
    .from(dailyArticleMetric)
    .where(eq(dailyArticleMetric.articleId, articleId))
  return Number(result?.views ?? 0)
}

export async function getAnalyticsReport(
  now = new Date(),
): Promise<AnalyticsReport> {
  const metrics = await db
    .select({
      articleId: dailyArticleMetric.articleId,
      articleTitle: article.title,
      metricDate: dailyArticleMetric.metricDate,
      views: dailyArticleMetric.views,
      uniqueVisitors: dailyArticleMetric.uniqueVisitors,
      lastVisitedAt: dailyArticleMetric.lastVisitedAt,
    })
    .from(dailyArticleMetric)
    .innerJoin(article, eq(dailyArticleMetric.articleId, article.id))

  const recentVisits = await db
    .select({
      id: articleViewEvent.id,
      articleId: articleViewEvent.articleId,
      articleTitle: article.title,
      ip: articleViewEvent.visitorIp,
      location: articleViewEvent.location,
      referrerDomain: articleViewEvent.referrerDomain,
      visitedAt: articleViewEvent.visitedAt,
    })
    .from(articleViewEvent)
    .innerJoin(article, eq(articleViewEvent.articleId, article.id))
    .orderBy(desc(articleViewEvent.visitedAt))
    .limit(50)

  const trend = (count: number) => {
    const days = recentDayList(count, now)
    return days.map((date) => {
      const rows = metrics.filter((item) => item.metricDate === date)
      return {
        date,
        views: rows.reduce((sum, item) => sum + item.views, 0),
        uniqueVisitors: rows.reduce(
          (sum, item) => sum + item.uniqueVisitors,
          0,
        ),
      }
    })
  }

  const ranking = new Map<
    string,
    AnalyticsReport['articleRanking'][number]
  >()
  for (const metric of metrics) {
    const current = ranking.get(metric.articleId)
    if (!current) {
      ranking.set(metric.articleId, {
        articleId: metric.articleId,
        articleTitle: metric.articleTitle,
        views: metric.views,
        uniqueVisitors: metric.uniqueVisitors,
        lastVisitedAt: metric.lastVisitedAt,
      })
      continue
    }
    current.views += metric.views
    current.uniqueVisitors += metric.uniqueVisitors
    if (
      metric.lastVisitedAt &&
      (!current.lastVisitedAt ||
        metric.lastVisitedAt > current.lastVisitedAt)
    ) {
      current.lastVisitedAt = metric.lastVisitedAt
    }
  }

  return {
    totalViews: metrics.reduce((sum, item) => sum + item.views, 0),
    uniqueVisitors: metrics.reduce(
      (sum, item) => sum + item.uniqueVisitors,
      0,
    ),
    sevenDayTrend: trend(7),
    thirtyDayTrend: trend(30),
    articleRanking: [...ranking.values()].sort(
      (left, right) => right.views - left.views,
    ),
    recentVisits,
  }
}

export async function purgeAnalyticsEvents(): Promise<number> {
  const cutoff = new Date(
    Date.now() - RAW_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  )
  const result = await db
    .delete(articleViewEvent)
    .where(lt(articleViewEvent.visitedAt, cutoff))
  return result[0].affectedRows
}
