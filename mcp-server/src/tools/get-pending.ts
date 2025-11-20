import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { connectToDB } from '../utils/db.js';
import Post from '../models/Post.js';
import User from '../models/User.js';

export const getPendingTool: Tool = {
  name: 'get_pending_posts',
  description: 'Get all pending posts awaiting moderation. Returns post details including ID, title, CID, and creation date.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of posts to return (default: 50)',
        default: 50,
      },
    },
  },
};

export async function handleGetPending(args: { limit?: number }): Promise<{
  count: number;
  posts: Array<{
    id: string;
    title?: string;
    cid: string;
    createdAt: string;
    userId: string;
  }>;
}> {
  try {
    await connectToDB();

    const limit = args.limit || 50;
    const posts = await Post.find({ status: 'PENDING' })
      .populate('userId', 'handle')
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    return {
      count: posts.length,
      posts: posts.map((post: any) => ({
        id: post._id.toString(),
        title: post.title,
        cid: post.cid,
        createdAt: post.createdAt.toISOString(),
        userId: post.userId?.handle || post.userId?._id?.toString() || 'unknown',
      })),
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch pending posts: ${error.message}`);
  }
}


