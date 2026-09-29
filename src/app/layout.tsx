import type { Metadata, Viewport } from 'next';
import { AppProviders } from '@/providers/app-providers';
import { getLocale } from '@/i18n/server';
import { messages } from '@/i18n/messages';
import '@/styles/globals.scss';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    {
      media: '(prefers-color-scheme: light)',
      color: '#ffffff',
    },
    {
      media: '(prefers-color-scheme: dark)',
      color: '#0c1020',
    },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'LearM — Learn Languages',
    template: '%s | LearM',
  },

  description:
    'Learn languages with interactive lessons, exercises, challenges, achievements, progress tracking and a global community.',

  applicationName: 'LearM',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'LearM', statusBarStyle: 'default' },
  icons: {
    icon: [
      { url: '/pwa/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon.svg?v=2', type: 'image/svg+xml' },
    ],
    shortcut: '/pwa/favicon-32.png',
    apple: '/pwa/apple-touch-icon.png',
  },

  keywords: [
    'LearM',
    'language learning',
    'learn English',
    'learn languages',
    'English lessons',
    'language courses',
    'interactive lessons',
    'language learning platform',
  ],

  authors: [
    {
      name: 'Motion Community',
    },
  ],

  creator: 'Motion Community',
  publisher: 'LearM',

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  openGraph: {
    type: 'website',
    siteName: 'LearM',
    title: 'LearM — Learn Languages',
    description:
      'Learn languages through interactive lessons, challenges, achievements and community.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LearM language learning platform',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'LearM — Learn Languages',
    description:
      'Learn languages through interactive lessons, challenges, achievements and community.',
    images: ['/og-image.png'],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main-content">
          {messages[locale].common.skip}
        </a>

        <AppProviders locale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
}
