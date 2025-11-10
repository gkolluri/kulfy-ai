'use client';

import React from 'react';
import { ImageLoader } from './image-loader';

interface CardProps {
  imageUrl: string;
  title?: string;
  alt?: string;
  postId?: string;
}

export function Card({ imageUrl, title, alt = 'Kulfy meme', postId }: CardProps) {
  const content = (
    <>
      <div className="relative w-full aspect-square overflow-hidden bg-gray-900">
        <ImageLoader
          src={imageUrl}
          alt={alt}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
      {title && (
        <div className="p-4">
          <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
            {title}
          </p>
        </div>
      )}
    </>
  );

  if (postId) {
    return (
      <a
        href={`/kulfy/${postId}`}
        className="block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
        // Prefetch image on hover for instant loading
        onMouseEnter={() => {
          if (typeof window !== 'undefined') {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.as = 'image';
            link.href = imageUrl;
            document.head.appendChild(link);
          }
        }}
      >
        {content}
      </a>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {content}
    </div>
  );
}

