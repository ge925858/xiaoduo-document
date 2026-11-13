import { Navigate } from 'react-router-dom'
import { categoryNotes, useSiteStore } from '../../store/siteStore'

export function LibraryIndexPage() {
  const categories = useSiteStore((state) => state.categories)
  const notes = useSiteStore((state) => state.notes)
  const firstCategory = categories
    .slice()
    .sort((a, b) => a.order - b.order)
    .find((category) => categoryNotes(category, notes).length > 0)
  const firstNote = firstCategory
    ? categoryNotes(firstCategory, notes)[0]
    : null

  if (firstCategory && firstNote) {
    return (
      <Navigate
        to={`/library/${firstCategory.slug}/${firstNote.slug}`}
        replace
      />
    )
  }

  return (
    <div className="library-empty-page">
      <p className="section-kicker">Empty library</p>
      <h1>笔记库还是空的</h1>
      <p>站主创建并发布第一个分类和章节后，会在这里出现。</p>
    </div>
  )
}
