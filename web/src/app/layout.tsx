import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
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
