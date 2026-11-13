import { notFound } from 'next/navigation'
import { ComponentGallery } from '@/components/visual/component-gallery'

export default function ComponentGalleryPage() {
  if (process.env.ENABLE_VISUAL_FIXTURES !== '1') notFound()
  return <ComponentGallery />
}
