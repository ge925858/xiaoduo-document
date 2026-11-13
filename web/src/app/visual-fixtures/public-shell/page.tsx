import { notFound } from 'next/navigation'
import { PublicLibraryShell } from '@/components/public-library-shell'
import { listPublicLibrary } from '@/lib/public-library'

export default async function PublicShellFixturePage() {
  if (process.env.ENABLE_VISUAL_FIXTURES !== '1') notFound()
  const library = await listPublicLibrary()
  return (
    <PublicLibraryShell categories={library}>
      <div className="public-shell-fixture-content" />
    </PublicLibraryShell>
  )
}
