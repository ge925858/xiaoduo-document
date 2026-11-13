import { useMemo, useState } from 'react'
import { Eye, FileText, MousePointerClick, Users } from 'lucide-react'
import { formatDateTime, formatRelativeTime } from '../../lib/text'
import { usePageTitle } from '../../lib/usePageTitle'
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

export function AnalyticsPage() {
  usePageTitle('访问报表 · 知笺')
  const notes = useSiteStore((state) => state.notes)
  const categories = useSiteStore((state) => state.categories)
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
      const key = shanghaiDateKey(date)
      return {
        key,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        views: filtered.filter(
          (event) => shanghaiDateKey(new Date(event.visitedAt)) === key,
        ).length,
      }
    })

    const articleStats = notes
      .filter((note) => !note.trashedAt)
      .map((note) => {
        const noteEvents = filtered.filter((event) => event.noteId === note.id)
        const category = categories.find(
          (item) => item.id === note.categoryId,
        )
        return {
          note,
          category,
          views: noteEvents.length,
          visitors: new Set(
            noteEvents.map((event) => event.visitorKey),
          ).size,
          lastVisit: noteEvents[0]?.visitedAt ?? null,
        }
      })
      .sort((left, right) => right.views - left.views)

    return {
      filtered,
      uniqueVisitors,
      daily,
      articleStats,
      maxDaily: Math.max(1, ...daily.map((item) => item.views)),
    }
  }, [categories, events, notes, now, range])

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
          value={report.filtered.length}
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
            report.articleStats.filter((item) => item.views > 0).length
          }
        />
        <MetricCard
          icon={FileText}
          label="公开文章"
          value={
            notes.filter(
              (note) =>
                !note.trashedAt &&
                note.publicationState === 'published',
            ).length
          }
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
            <div key={item.key} className="analytics-chart-column">
              <span
                style={{
                  height: `${Math.max(
                    item.views ? 8 : 2,
                    (item.views / report.maxDaily) * 100,
                  )}%`,
                }}
                title={`${item.key}: ${item.views} 次浏览`}
              />
              {range === 7 && <small>{item.label}</small>}
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
            <span>分类</span>
            <span>浏览量</span>
            <span>独立访客</span>
            <span>最近访问</span>
          </div>
          {report.articleStats.map((item) => (
            <div key={item.note.id} className="analytics-table-row">
              <strong>{item.note.title}</strong>
              <span>{item.category?.title ?? '未分类'}</span>
              <span>{item.views}</span>
              <span>{item.visitors}</span>
              <span>
                {item.lastVisit ? formatRelativeTime(item.lastVisit) : '暂无'}
              </span>
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
          {report.filtered.slice(0, 50).map((event) => {
            const note = notes.find((item) => item.id === event.noteId)
            return (
              <div key={event.id} className="analytics-visit-row">
                <span>{note?.title ?? '文章已删除'}</span>
                <code>{event.ip}</code>
                <span>{event.location}</span>
                <span>{event.referrerDomain}</span>
                <time>{formatDateTime(event.visitedAt)}</time>
              </div>
            )
          })}
          {!report.filtered.length && (
            <p className="analytics-empty">当前时间范围内没有访问记录</p>
          )}
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
