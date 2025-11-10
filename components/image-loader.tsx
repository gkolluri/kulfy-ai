'use client';

import { useState, useEffect, useRef } from 'react';

interface ImageLoaderProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  priority?: boolean;
}

// Fun Telugu loading messages with Kulfy branding
const teluguLoadingMessages = [
  { text: "Konchem wait chey... Kulfy load chestunna!", emoji: "🔍" },
  { text: "Picture ready avutundi... Patience!", emoji: "🎬" },
  { text: "Loading... Loading... Loadinguuu!", emoji: "⚡" },
  { text: "Inka konchem sepu... Almost ready!", emoji: "⏳" },
  { text: "Kulfy nundi teestunna... Wait chey boss!", emoji: "🚀" },
  { text: "Meme ready chestunam... Dhairyam!", emoji: "💪" },
  { text: "Kulfy download avutundi... Calm ga undandi!", emoji: "😎" },
  { text: "Vasthundi vasthundi... Kulfy vasthundi!", emoji: "🎭" },
  { text: "Network slow undi... Adjust chesko!", emoji: "🐌" },
  { text: "Loading babai... Lite tesko!", emoji: "🤙" },
  { text: "Kulfy ready avutundi... Chill!", emoji: "🍦" },
  { text: "Kulfy lo search... Inka sariga!", emoji: "🎯" },
];

export function ImageLoader({ 
  src, 
  alt, 
  className = '', 
  loading = 'lazy',
  priority = false,
}: ImageLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(teluguLoadingMessages[0]);
  const imgRef = useRef<HTMLImageElement>(null);

  // Set random message on mount and rotate faster for priority images
  useEffect(() => {
    setLoadingMessage(teluguLoadingMessages[Math.floor(Math.random() * teluguLoadingMessages.length)]);
    
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      const newMessage = teluguLoadingMessages[Math.floor(Math.random() * teluguLoadingMessages.length)];
      setLoadingMessage(newMessage);
    }, priority ? 1000 : 2000);

    return () => clearInterval(interval);
  }, [isLoading, priority]);

  // Check if image is already loaded (from cache)
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalHeight !== 0) {
      console.log('[ImageLoader] Image already loaded from cache:', src);
      setIsLoading(false);
    }
  }, [src]);

  // Fallback timeout to hide loading state
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('[ImageLoader] Timeout reached, hiding loader:', src);
        setIsLoading(false);
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading, src]);

  const handleLoad = () => {
    console.log('[ImageLoader] onLoad fired:', src);
    setIsLoading(false);
  };

  const handleError = () => {
    console.log('[ImageLoader] onError fired:', src);
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className="relative w-full h-full">
      {/* Animated Gradient Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 animate-pulse-slow">
          <div className="w-full h-full bg-gradient-to-br from-purple-400/20 via-pink-400/20 to-blue-400/20 animate-gradient-xy">
            {/* Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          {/* Loading Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <div className="inline-block mb-3">
                <svg
                  className="animate-spin h-12 w-12 text-purple-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <p className="text-3xl mb-2 animate-bounce">
                {loadingMessage.emoji}
              </p>
              <p className="text-sm font-bold text-purple-300 animate-pulse-fast">
                {loadingMessage.text}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-orange-900/20 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-4xl mb-2 animate-bounce">😅</div>
            <p className="text-sm text-red-300 font-bold">Ayyo! Picture raledhu!</p>
            <p className="text-xs text-red-400 mt-1">Network slow undi... Refresh chey!</p>
          </div>
        </div>
      )}

      {/* Actual Image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

// Skeleton component for cards
export function ImageSkeleton() {
  return (
    <div className="w-full h-full animate-pulse-slow">
      <div className="w-full h-full bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-blue-500/30 animate-gradient-xy relative overflow-hidden">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        {/* Decorative circles */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-400/20 rounded-full blur-xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-pink-400/20 rounded-full blur-xl animate-float-delayed" />
        
        {/* Loading icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/50">
            <svg
              className="animate-spin h-10 w-10"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

