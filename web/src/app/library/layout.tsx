import { PublicLibraryShell } from '@/components/public-library-shell'
import { listPublicLibrary } from '@/lib/public-library'

export default async function LibraryLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const library = await listPublicLibrary()
  return (
    <PublicLibraryShell categories={library}>
      {children}
    </PublicLibraryShell>
  )
}
