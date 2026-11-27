import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { GTM_ID } from '@/lib/analytics'
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SHORT_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
} from '@/lib/site'
import './globals.css'
import './shelf.css'
import './formats.css'

const ogImage = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: "Sid's Record Shelf: a wooden bookcase lined with album spines, sorted A to Z with Vinyl, Cassette, CD and Digital tabs",
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: 'v0.app',
  keywords: [
    'record collection',
    'vinyl collection',
    'album library',
    'music collection',
    'record shelf',
    'cassettes',
    'CDs',
    'album previews',
    'skeuomorphic design',
    'iOS 6 design',
    'hip hop',
    'rock',
    'jazz',
    'progressive metal',
  ],
  authors: [{ name: 'Sid', url: SITE_URL }],
  creator: 'Sid',
  category: 'music',
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_SHORT_DESCRIPTION,
    locale: 'en_US',
    images: [ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_SHORT_DESCRIPTION,
    images: [ogImage],
  },
  appleWebApp: { title: SITE_NAME, capable: true, statusBarStyle: 'default' },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#c8935a',
}

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: 'en',
      image: `${SITE_URL}/og-image.png`,
    },
    {
      '@type': 'Collection',
      '@id': `${SITE_URL}/#collection`,
      name: `${SITE_NAME}: personal music library`,
      url: SITE_URL,
      description:
        '1,970 albums, EPs, singles, compilations and soundtracks released between 1946 and 2026, spanning rock, pop, hip hop, electronic, metal and jazz.',
      collectionSize: 1970,
      genre: ['Rock', 'Pop', 'Hip Hop', 'Electronic', 'Heavy Metal', 'Jazz'],
      creator: { '@type': 'Person', name: 'Sid' },
      isPartOf: { '@id': `${SITE_URL}/#website` },
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="shelf-body antialiased">
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
            title="Google Tag Manager"
          />
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});`}
        </Script>
        <Script src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`} strategy="afterInteractive" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "zjwfkvr557");`}
        </Script>
      </body>
    </html>
  )
}
