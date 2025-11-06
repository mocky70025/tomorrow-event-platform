import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '出店者向け',
  description: 'イベント出店者向けプラットフォーム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
