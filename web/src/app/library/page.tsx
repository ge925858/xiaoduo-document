import Link from 'next/link'
import { listPublicLibrary } from '@/lib/public-library'

export default async function LibraryIndexPage() {
  const library = await listPublicLibrary()
  return (
    <div className="library-overview">
      <p className="eyebrow">Public knowledge book</p>
      <h1>笔记库</h1>
      <p>沿固定目录阅读持续修订的章节。</p>
      <div className="library-category-grid">
        {library.map((category) => (
          <section key={category.id}>
            <h2>
              <Link href={`/library/${category.slug}`}>{category.title}</Link>
            </h2>
            <ol>
              {category.chapters.map((chapter) => (
                <li key={chapter.articleId}>
                  <Link href={`/library/${category.slug}/${chapter.path}`}>
                    {chapter.title}
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  )
}
