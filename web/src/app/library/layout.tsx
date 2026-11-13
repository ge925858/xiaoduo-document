import Link from 'next/link'
import { PublicLibraryNav } from '@/components/public-library-nav'
import { listPublicLibrary } from '@/lib/public-library'

export default async function LibraryLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const library = await listPublicLibrary()
  return (
    <div className="public-library-shell">
      <header className="public-header">
        <Link href="/" className="public-brand">
          知笺
        </Link>
        <span>笔记库</span>
        <Link href="/library" className="public-library-home">
          全部内容
        </Link>
      </header>
      <aside className="public-sidebar">
        <PublicLibraryNav categories={library} />
        <Link href="/" className="public-back-link">
          返回预览页
        </Link>
      </aside>
      <main className="public-library-content">{children}</main>
    </div>
  )
}
