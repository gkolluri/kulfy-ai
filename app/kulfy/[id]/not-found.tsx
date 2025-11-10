export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl mb-4">🤷</div>
        <h1 className="text-4xl font-bold text-white mb-2">Kulfy Not Found</h1>
        <p className="text-gray-400 mb-8">
          This post doesn't exist or hasn't been approved yet.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/feed"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          >
            Browse Feed
          </a>
          <a
            href="/upload"
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
          >
            Upload Meme
          </a>
        </div>
      </div>
    </div>
  );
}

