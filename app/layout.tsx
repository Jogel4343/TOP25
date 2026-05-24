import type { Metadata } from 'next'
import { Inter, DM_Serif_Display } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Top25 Talent — Verified Students & Alumni from Top Universities',
    template: '%s | Top25 Talent',
  },
  description:
    'The recruiting marketplace for verified students and alumni from the top 25 US universities. Post internships and jobs directly to elite candidates.',
  keywords: [
    'recruiting',
    'university talent',
    'top college hiring',
    'internships',
    'campus recruiting',
    'verified students',
  ],
  authors: [{ name: 'Top25 Talent' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'Top25 Talent',
    title: 'Top25 Talent — Verified Students & Alumni from Top Universities',
    description:
      'The recruiting marketplace for verified students and alumni from the top 25 US universities.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Top25 Talent',
    description: 'Recruiting marketplace for verified top-university talent.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${dmSerifDisplay.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
