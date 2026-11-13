import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.APP_ORIGIN ?? 'http://127.0.0.1:3100',
  ),
  title: '知笺',
  description: '由站主长期维护的公开知识书',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
