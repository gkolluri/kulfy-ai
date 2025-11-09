'use client';

import { useState, FormEvent } from 'react';

export default function UploadPage() {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cid, setCid] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setCid(null);

    try {
      const formData = new FormData();
      if (title) formData.append('title', title);
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.ok) {
        setMessage({ 
          type: 'success', 
          text: `Upload successful! Your meme is pending moderation.` 
        });
        setCid(data.cid);
        setTitle('');
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Upload failed' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Navigation */}
      <div className="mb-6 flex gap-3 justify-center">
        <a href="/feed" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors text-sm">
          📱 Feed
        </a>
        <a href="/admin" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm">
          🛡️ Admin
        </a>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Upload Your Kulfy Meme
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="title" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Title (optional)
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={140}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Give your meme a title..."
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {title.length}/140 characters
            </p>
          </div>

          <div>
            <label 
              htmlFor="file-input" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Image File *
            </label>
            <input
              type="file"
              id="file-input"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-900 dark:file:text-purple-300"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Supported: PNG, JPEG, WebP, GIF • Max size: 6MB
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Uploading...' : 'Upload to IPFS'}
          </button>
        </form>

        {message && (
          <div
            className={`mt-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}
          >
            <p className="font-medium">{message.text}</p>
            {cid && (
              <div className="mt-2">
                <p className="text-sm">CID: <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">{cid}</code></p>
                <p className="text-sm mt-2">
                  Your post will appear in the <a href="/feed" className="underline font-semibold">feed</a> after moderation.
                  Go to the <a href="/admin" className="underline font-semibold">admin page</a> to approve it now!
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> All uploads are stored on IPFS via Pinata. Your content will be moderated automatically and appear in the feed once approved.
          </p>
        </div>
      </div>
    </div>
  );
}

