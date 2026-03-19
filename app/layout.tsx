import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '社内ポータル',
  description: '社内問い合わせシステム',
}

// viewport は Next.js 14以降 metadata と分けて export する
export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
