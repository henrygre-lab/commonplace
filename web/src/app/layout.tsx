import type { Metadata } from 'next'
import { Instrument_Sans, Newsreader } from 'next/font/google'
import './globals.css'

// Two typefaces only. Newsreader for anything editorial, Instrument Sans for UI.
const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-newsreader',
  display: 'swap',
})

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Commonplace',
  description:
    'Your bookmarks are a library nobody ever catalogued. Commonplace reads what you save on X and returns the right ideas each morning.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-GB"
      className={`${newsreader.variable} ${instrumentSans.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  )
}
