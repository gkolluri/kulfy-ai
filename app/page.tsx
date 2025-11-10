import { KulfyIcon } from '@/components/kulfy-icon';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-orange-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-24">
        {/* Hero Section */}
        <div className="text-center mb-12 mt-16">
          <div className="flex items-center justify-center gap-4 text-3xl md:text-4xl font-bold text-white/90 mb-4 animate-fade-in-up">
            <KulfyIcon size="xl" className="animate-bounce-slow" />
            <span className="text-5xl md:text-6xl">Telugu Memes</span>
            <span className="animate-bounce-slow delay-100 text-5xl">🎭</span>
          </div>
          <p className="mt-4 text-xl text-white/70 animate-fade-in-up delay-200">
            Auto Magic • Telugu • Hilarious
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-fade-in-up delay-300">
          <a
            href="/feed"
            className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold text-white text-lg shadow-2xl hover:shadow-pink-500/50 transform hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10">Browse Kulfys 🎬</span>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
          
          <a
            href="/upload"
            className="px-8 py-4 bg-white/10 backdrop-blur-lg border-2 border-white/30 rounded-full font-bold text-white text-lg hover:bg-white/20 hover:border-white/50 transform hover:scale-105 transition-all duration-300 shadow-2xl"
          >
            Upload Meme ⬆️
          </a>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full animate-fade-in-up delay-400">
          {/* Feature 1 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="text-4xl mb-3 animate-bounce-slow">✨</div>
            <h3 className="text-xl font-bold text-white mb-2">Auto Magic</h3>
            <p className="text-white/70 text-sm">
              Memes get auto-approved with LLMs doing the work. Like magic, but real!
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="text-4xl mb-3 animate-bounce-slow delay-100">🎭</div>
            <h3 className="text-xl font-bold text-white mb-2">Telugu Vibes</h3>
            <p className="text-white/70 text-sm">
              Exclusively for Telugu meme lovers. By meme lords, for meme lords!
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="text-4xl mb-3 animate-bounce-slow delay-200">📱</div>
            <h3 className="text-xl font-bold text-white mb-2">Easy Sharing</h3>
            <p className="text-white/70 text-sm">
              Share directly to WhatsApp, Twitter, or copy the link. One click!
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 animate-fade-in-up delay-500">
          <div className="text-center">
            <div className="text-3xl font-black text-white mb-1">🚀</div>
            <div className="text-white/70 text-sm">Week 1 MVP</div>
          </div>
          <div className="text-center flex flex-col items-center">
            <KulfyIcon size="md" />
            <div className="text-white/70 text-sm mt-1">100% Kulfy</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-white mb-1">😂</div>
            <div className="text-white/70 text-sm">Meme Magic</div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center animate-fade-in-up delay-600">
          <p className="text-white/60 text-sm mb-4">
            Built with Next.js • MongoDB • Pinata IPFS
          </p>
          <a
            href="/admin"
            className="text-white/40 hover:text-white/60 text-xs transition-colors"
          >
            Admin Dashboard →
          </a>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-white/50 rounded-full animate-scroll" />
        </div>
      </div>
    </div>
  );
}
