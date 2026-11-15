import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'teachMe | Learn English Online',
  description: "teachMe — plateforme d'apprentissage de l'anglais en ligne",
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/brand/teachme-mark.svg',
  },
  openGraph: {
    title: 'teachMe | Learn English Online',
    description: "Plateforme d'apprentissage de l'anglais en ligne",
    images: ['/brand/teachme-logo.svg'],
  },
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f5f0' },
    { media: '(prefers-color-scheme: dark)', color: '#1b2a4a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="noise">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
