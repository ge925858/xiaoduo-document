import { notFound } from 'next/navigation'
import { PublicPreview } from '@/components/public-preview'

export default function EmptyPublicPreviewFixture() {
  if (process.env.ENABLE_VISUAL_FIXTURES !== '1') notFound()
  return <PublicPreview profile={null} categories={[]} />
}
