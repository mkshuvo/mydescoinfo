import type { Metadata } from 'next';
import { Space_Grotesk, Manrope, Inter } from 'next/font/google';
import AuthProvider from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-headline',
  weight: ['300', '400', '500', '600', '700'],
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['200', '300', '400', '500', '600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-label',
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'WattWatch - Energy Management Dashboard',
  description:
    'Track your electricity meters, view daily consumption, and manage multiple accounts with WattWatch.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body className={`${spaceGrotesk.variable} ${manrope.variable} ${inter.variable} bg-background text-on-surface min-h-screen font-body antialiased`}>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
