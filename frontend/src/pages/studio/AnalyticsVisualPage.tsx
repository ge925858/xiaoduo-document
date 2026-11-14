import { useMemo, useState } from 'react'
import { Eye, FileText, MousePointerClick, Users } from 'lucide-react'
import { useSiteStore } from '../../store/siteStore'

type Range = 7 | 30

function shanghaiDateKey(value: Date) {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Shanghai',
  }).formatToParts(value)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Shanghai',
  }).format(new Date(value))
}

export function AnalyticsVisualPage() {
  const notes = useSiteStore((state) => state.notes)
  const events = useSiteStore((state) => state.articleViewEvents)
  const [range, setRange] = useState<Range>(30)
  const [now] = useState(() => Date.now())

  const report = useMemo(() => {
    const start = now - range * 24 * 60 * 60 * 1000
    const filtered = events
      .filter((event) => new Date(event.visitedAt).getTime() >= start)
      .sort((left, right) =>
        right.visitedAt.localeCompare(left.visitedAt),
      )
    const uniqueVisitors = new Set(
      filtered.map((event) => event.visitorKey),
    ).size
    const daily = Array.from({ length: range }, (_, index) => {
      const date = new Date(now)
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - (range - 1 - index))
      const dateKey = shanghaiDateKey(date)
      return {
        date: dateKey,
        views: filtered.filter(
          (event) =>
            shanghaiDateKey(new Date(event.visitedAt)) === dateKey,
        ).length,
      }
    })
    const articleRanking = notes
      .filter((note) => !note.trashedAt)
      .map((note) => {
        const noteEvents = filtered.filter(
          (event) => event.noteId === note.id,
        )
        return {
          articleId: note.id,
          articleTitle: note.title,
          views: noteEvents.length,
          uniqueVisitors: new Set(
            noteEvents.map((event) => event.visitorKey),
          ).size,
        }
      })
      .filter((item) => item.views > 0)
      .sort((left, right) => right.views - left.views)

    return {
      totalViews: filtered.length,
      uniqueVisitors,
      articleRanking,
      recentVisits: filtered.map((event) => ({
        ...event,
        articleTitle:
          notes.find((note) => note.id === event.noteId)?.title ??
          '文章已删除',
      })),
      daily,
    }
  }, [events, notes, now, range])

  const maxDaily = Math.max(1, ...report.daily.map((item) => item.views))

  return (
    <div className="studio-page analytics-page">
      <header className="studio-page-header">
        <div>
          <p className="section-kicker">Analytics</p>
          <h1>访问报表</h1>
          <p>
            仅站主可见。访问明细保留 30 天，统计数据按 Asia/Shanghai
            时区展示。
          </p>
        </div>
        <div className="segmented-control">
          {([7, 30] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={range === value ? 'is-active' : ''}
              onClick={() => setRange(value)}
            >
              最近 {value} 天
            </button>
          ))}
        </div>
      </header>

      <div className="analytics-kpis">
        <MetricCard
          icon={Eye}
          label="浏览量"
          value={report.totalViews}
        />
        <MetricCard
          icon={Users}
          label="独立访客"
          value={report.uniqueVisitors}
        />
        <MetricCard
          icon={MousePointerClick}
          label="有访问的文章"
          value={
            report.articleRanking.filter((item) => item.views > 0).length
          }
        />
        <MetricCard
          icon={FileText}
          label="访问记录"
          value={report.recentVisits.length}
        />
      </div>

      <section className="analytics-section">
        <header>
          <div>
            <h2>访问趋势</h2>
            <p>按天汇总的公开文章浏览量</p>
          </div>
        </header>
        <div className="analytics-chart">
          {report.daily.map((item) => (
            <div key={item.date} className="analytics-chart-column">
              <span
                style={{
                  height: `${Math.max(
                    item.views ? 8 : 2,
                    (item.views / maxDaily) * 100,
                  )}%`,
                }}
                title={`${item.date}: ${item.views} 次浏览`}
              />
              {range === 7 ? <small>{item.date.slice(5)}</small> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="analytics-section">
        <header>
          <div>
            <h2>文章排行</h2>
            <p>按浏览量从高到低排列</p>
          </div>
        </header>
        <div className="analytics-article-table">
          <div className="analytics-table-head">
            <span>文章</span>
            <span>独立访客</span>
            <span>浏览量</span>
          </div>
          {report.articleRanking.map((item) => (
            <div key={item.articleId} className="analytics-table-row">
              <strong>{item.articleTitle}</strong>
              <span>{item.uniqueVisitors}</span>
              <span>{item.views}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="analytics-section">
        <header>
          <div>
            <h2>最近访问</h2>
            <p>完整访客来源 IP 仅在此站主报表中展示</p>
          </div>
        </header>
        <div className="analytics-visit-list">
          <div className="analytics-visit-head">
            <span>文章</span>
            <span>访客 IP</span>
            <span>所在地</span>
            <span>来源</span>
            <span>访问时间</span>
          </div>
          {report.recentVisits.map((visit) => (
            <div key={visit.id} className="analytics-visit-row">
              <span>{visit.articleTitle}</span>
              <code>{visit.ip}</code>
              <span>{visit.location}</span>
              <span>{visit.referrerDomain}</span>
              <time>{formatTime(visit.visitedAt)}</time>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye
  label: string
  value: number
}) {
  return (
    <article className="analytics-kpi">
      <Icon size={16} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}
