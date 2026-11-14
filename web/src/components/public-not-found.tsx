import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export function PublicNotFound() {
  return (
    <div className="site-container flex min-h-[58vh] flex-col items-center justify-center text-center">
      <p className="font-display text-[72px] leading-none text-[var(--line-strong)]">
        404
      </p>
      <h1 className="mt-5 font-display text-3xl text-[var(--ink)]">
        这一页还没有长出来
      </h1>
      <p className="mt-3 text-sm text-[var(--muted)]">
        它可能仍是草稿，也可能已经被移动到别处。
      </p>
      <Link href="/" className="back-link mt-8">
        <ArrowLeft size={18} />
        回到首页
      </Link>
    </div>
  )
}
