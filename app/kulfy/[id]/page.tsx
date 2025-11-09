import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connectToDB } from '@/lib/db';
import { cidToUrl } from '@/lib/pinata';
import Post from '@/models/Post';
import User from '@/models/User';
import Tag from '@/models/Tag';
import ShareButtons from '@/components/share-buttons';

export const dynamic = 'force-dynamic';

interface PostDetail {
  _id: string;
  cid: string;
  title?: string;
  mime: string;
  width?: number;
  height?: number;
  status: string;
  createdAt: Date;
  user: {
    handle: string;
  };
  tags: Array<{
    name: string;
  }>;
}

async function getPost(id: string): Promise<PostDetail | null> {
  try {
    await connectToDB();
    
    // Ensure models are loaded
    if (!User || !Tag) {
      throw new Error('Models not loaded');
    }

    const post = await Post.findById(id)
      .populate('userId', 'handle')
      .populate('tags', 'name')
      .lean();

    if (!post || post.status !== 'APPROVED') {
      return null;
    }

    return {
      _id: post._id.toString(),
      cid: post.cid,
      title: post.title,
      mime: post.mime,
      width: post.width,
      height: post.height,
      status: post.status,
      createdAt: post.createdAt,
      user: {
        handle: post.userId?.handle || 'anonymous',
      },
      tags: post.tags?.map((tag: any) => ({ name: tag.name })) || [],
    };
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return {
      title: 'Post Not Found - Kulfy',
    };
  }

  const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://kulfy-ai.vercel.app'}${cidToUrl(post.cid)}`;

  return {
    title: post.title ? `${post.title} - Kulfy` : 'Kulfy Meme',
    description: `Check out this Telugu meme on Kulfy! Posted by @${post.user.handle}`,
    openGraph: {
      title: post.title || 'Kulfy Meme',
      description: `Posted by @${post.user.handle}`,
      images: [imageUrl],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title || 'Kulfy Meme',
      description: `Posted by @${post.user.handle}`,
      images: [imageUrl],
    },
  };
}

export default async function KulfyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  const imageUrl = cidToUrl(post.cid);
  const fullUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://kulfy-ai.vercel.app'}/kulfy/${id}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-6 flex gap-3">
          <a
            href="/feed"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors text-sm"
          >
            ← Back to Feed
          </a>
          <a
            href="/upload"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors text-sm"
          >
            ⬆️ Upload
          </a>
        </div>

        {/* Main Content Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
          {/* Image */}
          <div className="relative bg-black">
            <img
              src={imageUrl}
              alt={post.title || 'Kulfy meme'}
              className="w-full h-auto max-h-[70vh] object-contain mx-auto"
            />
          </div>

          {/* Post Details */}
          <div className="p-6 space-y-6">
            {/* Title */}
            {post.title && (
              <h1 className="text-3xl font-bold text-white">
                {post.title}
              </h1>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-gray-300 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-purple-400">👤</span>
                <span>By <span className="font-semibold text-purple-300">@{post.user.handle}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-400">📅</span>
                <span>{new Date(post.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              {post.width && post.height && (
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">📐</span>
                  <span>{post.width} × {post.height}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-600/30 text-purple-200 rounded-full text-sm border border-purple-500/50"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Share Buttons */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Share this Kulfy</h3>
              <ShareButtons url={fullUrl} title={post.title} />
            </div>

            {/* IPFS Info */}
            <div className="border-t border-white/10 pt-6">
              <details className="group">
                <summary className="cursor-pointer text-sm font-semibold text-gray-400 hover:text-gray-300 transition-colors">
                  🔗 IPFS Details
                </summary>
                <div className="mt-3 space-y-2 text-sm text-gray-400">
                  <p className="break-all">
                    <span className="font-semibold">CID:</span> {post.cid}
                  </p>
                  <p>
                    <span className="font-semibold">Type:</span> {post.mime}
                  </p>
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${post.cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    View on Public Gateway ↗
                  </a>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Related Posts Section (Placeholder) */}
        <div className="mt-8 text-center">
          <a
            href="/feed"
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          >
            Explore More Kulfys →
          </a>
        </div>
      </div>
    </div>
  );
}

