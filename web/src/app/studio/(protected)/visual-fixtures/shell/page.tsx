import { notFound } from 'next/navigation'

export default function StudioShellFixturePage() {
  if (process.env.ENABLE_VISUAL_FIXTURES !== '1') notFound()
  return <div className="studio-shell-fixture-content" />
}
