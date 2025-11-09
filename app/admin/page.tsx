'use client';

import { useEffect, useState } from 'react';
import { ImageLoader } from '@/components/image-loader';

interface PendingPost {
  _id: string;
  cid: string;
  title?: string;
  mime: string;
  width?: number;
  height?: number;
  createdAt: string;
  userId: {
    handle: string;
  };
}

export default function AdminPage() {
  const [posts, setPosts] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPendingPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/pending');
      if (!response.ok) throw new Error('Failed to fetch pending posts');
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPosts();
  }, []);

  const handleApprove = async (postId: string) => {
    try {
      setProcessing(postId);
      setMessage(null);
      
      const response = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) throw new Error('Failed to approve post');
      
      const data = await response.json();
      setMessage({ type: 'success', text: `Post approved with tags: ${data.tags.join(', ')}` });
      
      // Remove the post from the list
      setPosts(posts.filter(p => p._id !== postId));
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (postId: string) => {
    try {
      setProcessing(postId);
      setMessage(null);
      
      const response = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) throw new Error('Failed to reject post');
      
      setMessage({ type: 'success', text: 'Post rejected' });
      
      // Remove the post from the list
      setPosts(posts.filter(p => p._id !== postId));
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkApprove = async () => {
    try {
      setProcessing('bulk');
      setMessage(null);
      
      const response = await fetch('/api/agent/run');
      if (!response.ok) throw new Error('Failed to bulk approve');
      
      const data = await response.json();
      setMessage({ type: 'success', text: `Approved ${data.processed} posts` });
      
      // Refresh the list
      await fetchPendingPosts();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setProcessing(null);
    }
  };

  const getImageUrl = (cid: string) => {
    // Use API proxy to handle gateway authentication
    return `/api/image/${cid}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading pending posts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🛡️ Moderation Dashboard</h1>
          <p className="text-gray-300">Review and approve pending posts</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'
          }`}>
            <p className={message.type === 'success' ? 'text-green-300' : 'text-red-300'}>
              {message.text}
            </p>
          </div>
        )}

        {/* Action Bar */}
        <div className="mb-6 flex gap-4 items-center">
          <button
            onClick={handleBulkApprove}
            disabled={posts.length === 0 || processing === 'bulk'}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
          >
            {processing === 'bulk' ? '⏳ Processing...' : `✅ Approve All (${posts.length})`}
          </button>
          
          <button
            onClick={fetchPendingPosts}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            🔄 Refresh
          </button>

          <a
            href="/feed"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          >
            👁️ View Feed
          </a>
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-2">All Clear!</h2>
            <p className="text-gray-400">No pending posts to review</p>
            <a
              href="/upload"
              className="inline-block mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
            >
              Upload New Post
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div
                key={post._id}
                className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden border border-white/20 hover:border-purple-500 transition-all"
              >
                {/* Image */}
                <div className="relative aspect-square bg-black/50 overflow-hidden">
                  <ImageLoader
                    src={getImageUrl(post.cid)}
                    alt={post.title || 'Pending post'}
                    loading="lazy"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 right-2 px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full z-10">
                    PENDING
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  {post.title && (
                    <h3 className="text-white font-semibold text-lg mb-2 truncate">
                      {post.title}
                    </h3>
                  )}
                  
                  <div className="text-gray-300 text-sm space-y-1 mb-4">
                    <p>👤 By: <span className="text-purple-300">@{post.userId.handle}</span></p>
                    <p>📁 Type: {post.mime}</p>
                    {post.width && post.height && (
                      <p>📐 Size: {post.width} × {post.height}</p>
                    )}
                    <p>🕒 {new Date(post.createdAt).toLocaleString()}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(post._id)}
                      disabled={processing === post._id}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors text-sm"
                    >
                      {processing === post._id ? '⏳' : '✅ Approve'}
                    </button>
                    
                    <button
                      onClick={() => handleReject(post._id)}
                      disabled={processing === post._id}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors text-sm"
                    >
                      {processing === post._id ? '⏳' : '❌ Reject'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

