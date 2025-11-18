"use client";

import { FC } from "react";

export const TeluguLoadingAnimation: FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="relative w-64 h-64 mb-6">
        {/* Animated Telugu cinema elements */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Rotating film reel */}
          <div className="w-32 h-32 border-4 border-purple-500 rounded-full animate-spin border-dashed">
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl">🎬</span>
            </div>
          </div>
        </div>
        
        {/* Floating Telugu text */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 animate-bounce">
          <span className="text-2xl font-bold text-purple-600">కుల్ఫీ</span>
        </div>
        
        {/* Floating emojis */}
        <div className="absolute bottom-0 left-0 animate-pulse">
          <span className="text-3xl">🎭</span>
        </div>
        <div className="absolute bottom-0 right-0 animate-pulse delay-300">
          <span className="text-3xl">🎪</span>
        </div>
        <div className="absolute top-1/2 left-0 animate-pulse delay-150">
          <span className="text-2xl">🎨</span>
        </div>
        <div className="absolute top-1/2 right-0 animate-pulse delay-75">
          <span className="text-2xl">✨</span>
        </div>
      </div>
      
      {/* Loading text */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-purple-600 animate-pulse">
          Creating Your Telugu Meme...
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          🎬 DALL-E is crafting your masterpiece
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-75"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-150"></div>
        </div>
      </div>
      
      {/* Fun Telugu cinema quote */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
          &quot;మీ మీమ్ సిద్ధం అవుతోంది...&quot; 🎉
        </p>
      </div>
    </div>
  );
};



