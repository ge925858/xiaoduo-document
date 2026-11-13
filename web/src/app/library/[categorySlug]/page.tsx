import Link from 'next/link'
import { notFound } from 'next/navigation'
import { listPublicLibrary } from '@/lib/public-library'
import { countWords } from '@/lib/markdown-headings'

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>
}) {
  const { categorySlug } = await params
  const library = await listPublicLibrary()
  const category = library.find(
    (item) => item.slug === decodeURIComponent(categorySlug),
  )
  if (!category) notFound()

  return (
    <div className="library-overview">
      <p className="eyebrow">Category</p>
      <h1>{category.title}</h1>
      <ol className="category-chapter-list">
        {category.chapters.map((chapter) => (
          <li key={chapter.articleId}>
            <Link href={`/library/${category.slug}/${chapter.path}`}>
              <strong>{chapter.title}</strong>
              <span>{countWords(chapter.plainText)} 字</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
