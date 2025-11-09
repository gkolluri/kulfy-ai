import type { Metadata } from 'next';
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
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <a href="/" className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                🍦 Kulfy
              </a>
              <nav className="flex gap-4">
                <a
                  href="/upload"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Upload
                </a>
                <a
                  href="/feed"
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Feed
                </a>
              </nav>
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

