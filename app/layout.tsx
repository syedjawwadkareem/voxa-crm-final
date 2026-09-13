import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

import { NotificationProvider } from '@/components/ui/NotificationProvider'

export const metadata: Metadata = {
  title: 'VOXA Admin Portal',
  description: 'Enterprise Communication Platform',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-background text-foreground">
        {children}
        <NotificationProvider />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
