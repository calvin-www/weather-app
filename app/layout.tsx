import '@/styles/globals.css';
import { Metadata, Viewport } from 'next';
import clsx from 'clsx';
import { Toaster } from 'react-hot-toast';

import { Providers } from './providers';

import { fontSans } from '@/config/fonts';
import { ClientLayout } from '@/components/client-layout';

export const metadata: Metadata = {
  title: 'Weather App',
  description: 'A modern weather application built with Next.js and Hero UI',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body className={clsx('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        <Providers themeProps={{ attribute: 'class', defaultTheme: 'dark' }}>
          <ClientLayout>
            {children}
            <Toaster position="top-right" />
          </ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
