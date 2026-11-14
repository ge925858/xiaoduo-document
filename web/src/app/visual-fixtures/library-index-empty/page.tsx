import { notFound } from 'next/navigation'
import { PublicLibraryIndex } from '@/components/public-library-index'

export default function EmptyLibraryIndexFixture() {
  if (process.env.ENABLE_VISUAL_FIXTURES !== '1') notFound()
  return <PublicLibraryIndex categories={[]} />
}
