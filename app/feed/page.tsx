import { connectToDB } from '@/lib/db';
import { cidToUrl } from '@/lib/pinata';
import Post from '@/models/Post';
import { Card } from '@/components/card';

export const dynamic = 'force-dynamic';

interface PostData {
  _id: string;
  cid: string;
  title?: string;
  mime: string;
  createdAt: Date;
}

async function getApprovedPosts(): Promise<PostData[]> {
  await connectToDB();
  
  const posts = await Post.find({ status: 'APPROVED' })
    .sort({ createdAt: -1 })
    .limit(60)
    .lean();
  
  return posts.map(post => ({
    _id: post._id.toString(),
    cid: post.cid,
    title: post.title,
    mime: post.mime,
    createdAt: post.createdAt,
  }));
}

export default async function FeedPage() {
  const posts = await getApprovedPosts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Navigation */}
      <div className="mb-6 flex gap-3 justify-center">
        <a href="/upload" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors text-sm">
          ⬆️ Upload Kulfy
        </a>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Kulfy Feed 🍦
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Discover the latest approved Telugu memes from the community
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🤷</div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            No memes yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Be the first to upload a Kulfy meme!
          </p>
          <a
            href="/upload"
            className="inline-block px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
          >
            Upload Now
          </a>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {posts.length} approved meme{posts.length !== 1 ? 's' : ''}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {posts.map((post) => (
              <Card
                key={post._id}
                imageUrl={cidToUrl(post.cid)}
                title={post.title}
                alt={post.title || 'Kulfy meme'}
                postId={post._id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

