import React from 'react';

interface CardProps {
  imageUrl: string;
  title?: string;
  alt?: string;
}

export function Card({ imageUrl, title, alt = 'Kulfy meme' }: CardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative w-full aspect-square">
        <img
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
    </div>
  );
}

