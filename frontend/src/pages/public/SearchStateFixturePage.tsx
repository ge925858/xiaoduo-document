import { Button } from '../../components/ui/Button'

export function SearchLoadingFixturePage() {
  return (
    <div className="page-loader">
      <span />
      正在搜索公开章节
    </div>
  )
}

export function SearchErrorFixturePage() {
  return (
    <div className="search-results-empty">
      <p className="font-display text-xl text-[var(--ink)]">
        搜索暂时不可用
      </p>
      <p>请稍后重试。</p>
      <Button type="button">重新搜索</Button>
    </div>
  )
}
