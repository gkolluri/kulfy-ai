'use client';

import { useState } from 'react';
import { ImageLoader } from '@/components/image-loader';

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
}

export default function MCPTestPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approve' | 'reject' | 'upload'>('pending');
  const [results, setResults] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [postId, setPostId] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [imageData, setImageData] = useState('');
  const [title, setTitle] = useState('');

  const testGetPending = async () => {
    setLoading(true);
    setResults(null);
    try {
      const response = await fetch('/api/admin/pending');
      if (!response.ok) throw new Error('Failed to fetch pending posts');
      const data = await response.json();
      setResults({ success: true, data });
    } catch (error: any) {
      setResults({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testApprove = async () => {
    if (!postId.trim()) {
      setResults({ success: false, error: 'Post ID is required' });
      return;
    }
    
    setLoading(true);
    setResults(null);
    try {
      const response = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve post');
      }
      const data = await response.json();
      setResults({ success: true, data });
    } catch (error: any) {
      setResults({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testReject = async () => {
    if (!postId.trim()) {
      setResults({ success: false, error: 'Post ID is required' });
      return;
    }
    
    setLoading(true);
    setResults(null);
    try {
      const response = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, notes: rejectNotes || undefined }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject post');
      }
      const data = await response.json();
      setResults({ success: true, data });
    } catch (error: any) {
      setResults({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImageData(base64);
    };
    reader.readAsDataURL(file);
  };

  const testUpload = async () => {
    if (!imageData) {
      setResults({ success: false, error: 'Please select an image' });
      return;
    }
    
    setLoading(true);
    setResults(null);
    try {
      // Convert data URL to base64 for the API
      const base64Match = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (!base64Match) {
        throw new Error('Invalid image format');
      }

      // For now, we'll use the regular upload API
      // In a real MCP test, you'd call the MCP server directly
      const formData = new FormData();
      const blob = await fetch(imageData).then(r => r.blob());
      formData.append('file', blob);
      if (title) formData.append('title', title);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload');
      }
      const data = await response.json();
      setResults({ success: true, data });
    } catch (error: any) {
      setResults({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🧪 MCP Server Test Interface</h1>
          <p className="text-gray-300">Test MCP server tools via Next.js API routes</p>
          <p className="text-sm text-gray-400 mt-2">
            Note: This tests the underlying APIs. For actual MCP usage, configure your MCP client (Claude Desktop, Cursor, etc.)
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-white/20">
          {(['pending', 'approve', 'reject', 'upload'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === tab
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Test Forms */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
          {activeTab === 'pending' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Get Pending Posts</h2>
              <p className="text-gray-300 mb-4">Fetches all pending posts awaiting moderation.</p>
              <button
                onClick={testGetPending}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-semibold"
              >
                {loading ? 'Loading...' : 'Test get_pending_posts'}
              </button>
            </div>
          )}

          {activeTab === 'approve' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Approve Post</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Post ID</label>
                  <input
                    type="text"
                    value={postId}
                    onChange={(e) => setPostId(e.target.value)}
                    placeholder="Enter post ID"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  onClick={testApprove}
                  disabled={loading || !postId.trim()}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-semibold"
                >
                  {loading ? 'Processing...' : 'Test approve_post'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'reject' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Reject Post</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Post ID</label>
                  <input
                    type="text"
                    value={postId}
                    onChange={(e) => setPostId(e.target.value)}
                    placeholder="Enter post ID"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Rejection Notes (optional)</label>
                  <textarea
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    placeholder="Optional rejection reason"
                    rows={3}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  onClick={testReject}
                  disabled={loading || !postId.trim()}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-semibold"
                >
                  {loading ? 'Processing...' : 'Test reject_post'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Upload Meme</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Image File</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  />
                  {imageData && (
                    <div className="mt-4">
                      <ImageLoader
                        src={imageData}
                        alt="Preview"
                        className="max-w-xs rounded-lg"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Title (optional)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Meme title"
                    maxLength={140}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  onClick={testUpload}
                  disabled={loading || !imageData}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-semibold"
                >
                  {loading ? 'Uploading...' : 'Test upload_meme'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {results && (
          <div className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 border ${
            results.success ? 'border-green-500/50' : 'border-red-500/50'
          }`}>
            <h3 className={`text-lg font-bold mb-4 ${
              results.success ? 'text-green-300' : 'text-red-300'
            }`}>
              {results.success ? '✅ Success' : '❌ Error'}
            </h3>
            <pre className="bg-black/50 p-4 rounded-lg overflow-auto text-sm text-gray-300">
              {results.error || JSON.stringify(results.data, null, 2)}
            </pre>
          </div>
        )}

        {/* MCP Client Setup Info */}
        <div className="mt-8 bg-blue-500/20 border border-blue-500/50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-3">📖 Using with MCP Clients</h3>
          <p className="text-gray-300 mb-4">
            To use this MCP server with Claude Desktop, Cursor, or other MCP clients:
          </p>
          <div className="space-y-2 text-sm text-gray-300 font-mono bg-black/30 p-4 rounded-lg">
            <p>1. Build the MCP server:</p>
            <p className="ml-4">cd mcp-server && npm run build</p>
            <p className="mt-4">2. Configure your MCP client (e.g., Claude Desktop config):</p>
            <pre className="ml-4 mt-2 text-xs overflow-x-auto">
{`{
  "mcpServers": {
    "kulfy": {
      "command": "node",
      "args": ["/path/to/kulfy-ai/mcp-server/dist/index.js"],
      "env": {
        "MONGODB_URI": "...",
        "PINATA_JWT": "...",
        "PINATA_GATEWAY": "..."
      }
    }
  }
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

