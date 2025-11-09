import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to Kulfy 🍦
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Share and discover Telugu memes on the decentralized web
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link
            href="/upload"
            className="px-8 py-3 bg-purple-600 text-white text-lg font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
          >
            Upload Your Meme
          </Link>
          <Link
            href="/feed"
            className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-lg font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Browse Feed
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16 text-left">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="text-3xl mb-3">🖼️</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Upload Memes
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Share your favorite Telugu memes with the community. All content is stored on IPFS.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Auto-Moderation
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              AI-powered moderation ensures quality content. Posts are auto-tagged for discovery.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="text-3xl mb-3">🌐</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Decentralized
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Content lives on IPFS forever. No single point of failure, truly decentralized.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

