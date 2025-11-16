'use client';

import { useState } from 'react';

const kulfyChatUrl = process.env.NEXT_PUBLIC_KULFY_CHAT_URL || "http://localhost:6001";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <svg
          className="w-6 h-6 text-gray-700 dark:text-gray-300"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={closeMenu}
          />
          <div className="fixed top-[73px] left-0 right-0 bg-white dark:bg-gray-900 shadow-lg z-50 md:hidden border-t border-gray-200 dark:border-gray-700 transform transition-all duration-200 ease-out">
            <nav className="flex flex-col p-4 gap-2">
              <a
                href={kulfyChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenu}
                className="px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm rounded-lg font-semibold hover:shadow-md hover:shadow-cyan-500/30 transition-all duration-300 text-center"
              >
                ✨ Create Kulfy
              </a>
              <a
                href="/upload"
                onClick={closeMenu}
                className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-lg font-semibold hover:shadow-md hover:shadow-pink-500/30 transition-all duration-300 text-center"
              >
                Upload
              </a>
              <a
                href="/feed"
                onClick={closeMenu}
                className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-lg font-semibold hover:shadow-md hover:shadow-purple-500/30 transition-all duration-300 text-center"
              >
                📱 Feed
              </a>
              <a
                href="/generate"
                onClick={closeMenu}
                className="px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm rounded-lg font-semibold hover:shadow-md hover:shadow-green-500/30 transition-all duration-300 text-center"
              >
                🤖 AI
              </a>
            </nav>
          </div>
        </>
      )}
    </>
  );
}

