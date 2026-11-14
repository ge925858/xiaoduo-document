import { notFound } from 'next/navigation'
import { PublicLibraryShell } from '@/components/public-library-shell'
import { PublicSearchLoading } from '@/components/public-search-state'
import { listPublicLibrary } from '@/lib/public-library'

export default async function SearchLoadingFixturePage() {
  if (process.env.ENABLE_VISUAL_FIXTURES !== '1') notFound()
  return (
    <PublicLibraryShell categories={await listPublicLibrary()}>
      <PublicSearchLoading />
    </PublicLibraryShell>
  )
}
