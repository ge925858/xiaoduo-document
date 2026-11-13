import { redirect } from 'next/navigation'
import { requireOwner } from '@/lib/server-session'
import { getAnalyticsReport } from '@/server/analytics'

export const dynamic = 'force-dynamic'

function formatTime(value: Date | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Shanghai',
  }).format(value)
}

export default async function AnalyticsPage() {
  const session = await requireOwner()
  if (!session) redirect('/studio')
  const report = await getAnalyticsReport()

  return (
    <section className="analytics-page">
      <p className="eyebrow">Analytics</p>
      <h1>访问统计</h1>
      <div className="analytics-totals">
        <article>
          <span>总浏览量</span>
          <strong>{report.totalViews}</strong>
        </article>
        <article>
          <span>独立访客</span>
          <strong>{report.uniqueVisitors}</strong>
        </article>
      </div>

      <h2>7 天趋势</h2>
      <table>
        <thead>
          <tr>
            <th>日期</th>
            <th>浏览量</th>
            <th>独立访客</th>
          </tr>
        </thead>
        <tbody>
          {report.sevenDayTrend.map((day) => (
            <tr key={day.date}>
              <td>{day.date}</td>
              <td>{day.views}</td>
              <td>{day.uniqueVisitors}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <details>
        <summary>30 天趋势</summary>
        <table>
          <thead>
            <tr>
              <th>日期</th>
              <th>浏览量</th>
              <th>独立访客</th>
            </tr>
          </thead>
          <tbody>
            {report.thirtyDayTrend.map((day) => (
              <tr key={day.date}>
                <td>{day.date}</td>
                <td>{day.views}</td>
                <td>{day.uniqueVisitors}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <h2>文章排行</h2>
      <table>
        <thead>
          <tr>
            <th>文章</th>
            <th>浏览量</th>
            <th>独立访客</th>
            <th>最近访问</th>
          </tr>
        </thead>
        <tbody>
          {report.articleRanking.map((item) => (
            <tr key={item.articleId}>
              <td>{item.articleTitle}</td>
              <td>{item.views}</td>
              <td>{item.uniqueVisitors}</td>
              <td>{formatTime(item.lastVisitedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>最近访问记录</h2>
      <div className="analytics-table-scroll">
        <table>
          <thead>
            <tr>
              <th>文章</th>
              <th>访客 IP</th>
              <th>所在地</th>
              <th>来源域名</th>
              <th>访问时间</th>
            </tr>
          </thead>
          <tbody>
            {report.recentVisits.map((visit) => (
              <tr key={visit.id}>
                <td>{visit.articleTitle}</td>
                <td>{visit.ip}</td>
                <td>{visit.location}</td>
                <td>{visit.referrerDomain}</td>
                <td>{formatTime(visit.visitedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
