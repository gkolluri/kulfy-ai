import type { Metadata } from 'next';
import Script from 'next/script';
import { KulfyIcon } from '@/components/kulfy-icon';
import { MobileMenu } from '@/components/mobile-menu';
import { ServiceWorkerRegistration } from '@/components/sw-registration';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Kulfy - Telugu Meme Platform',
  description: 'Share and discover Telugu memes on IPFS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ZV7JQ98CLH"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ZV7JQ98CLH');
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ServiceWorkerRegistration />
        <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <a href="/" className="flex items-center gap-2 group">
                <KulfyIcon size="sm" />
                <span className="text-2xl font-black animate-gradient-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent animate-text-shimmer">
                  KULFY
                </span>
              </a>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex gap-2">
                <a
                  href={process.env.NEXT_PUBLIC_KULFY_CHAT_URL || "https://kulfy-chat.vercel.app/"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm rounded-full font-semibold hover:shadow-md hover:shadow-cyan-500/30 transition-all duration-300"
                >
                  ✨ Create Kulfy
                </a>
                <a
                  href="/upload"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-full font-semibold hover:shadow-md hover:shadow-pink-500/30 transition-all duration-300"
                >
                  Upload
                </a>
                <a
                  href="/feed"
                  className="px-4 py-2 text-purple-600 dark:text-purple-400 text-sm rounded-full font-semibold hover:bg-purple-50 dark:hover:bg-gray-800 transition-all duration-300"
                >
                  Feed
                </a>
                <a
                  href="/generate"
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm rounded-full font-semibold hover:shadow-md hover:shadow-green-500/30 transition-all duration-300"
                >
                  🤖 AI
                </a>
              </nav>
              
              {/* Mobile Menu */}
              <MobileMenu />
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="mt-auto py-8 text-center text-gray-600 dark:text-gray-400">
          <p>Kulfy - Week 1 MVP • Built with Next.js, MongoDB, and Pinata IPFS</p>
        </footer>
      </body>
    </html>
  );
}

