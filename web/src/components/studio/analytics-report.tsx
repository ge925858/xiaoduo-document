'use client'

import { Eye, FileText, MousePointerClick, Users } from 'lucide-react'
import { useState } from 'react'
import type { AnalyticsReport as Report } from '@/server/analytics'
import { cn } from '@/lib/utils'

type Range = 7 | 30

function formatTime(value: Date | null): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Shanghai',
  }).format(value)
}

export function AnalyticsReport({ report }: { report: Report }) {
  const [range, setRange] = useState<Range>(30)
  const trend = range === 7 ? report.sevenDayTrend : report.thirtyDayTrend
  const maxDaily = Math.max(1, ...trend.map((item) => item.views))

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
        <MetricCard icon={Eye} label="浏览量" value={report.totalViews} />
        <MetricCard
          icon={Users}
          label="独立访客"
          value={report.uniqueVisitors}
        />
        <MetricCard
          icon={MousePointerClick}
          label="有访问的文章"
          value={report.articleRanking.filter((item) => item.views > 0).length}
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
          {trend.map((item) => (
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
          {!report.recentVisits.length ? (
            <p className="analytics-empty">当前时间范围内没有访问记录</p>
          ) : null}
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
    <article className={cn('analytics-kpi')}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}
