import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { connectToDB } from '../utils/db.js';
import Post from '../models/Post.js';

export const rejectPostTool: Tool = {
  name: 'reject_post',
  description: 'Reject a pending post. Optionally provide rejection notes. Returns the updated post status.',
  inputSchema: {
    type: 'object',
    properties: {
      postId: {
        type: 'string',
        description: 'The ID of the post to reject',
      },
      notes: {
        type: 'string',
        description: 'Optional rejection notes (max 500 characters)',
        maxLength: 500,
      },
    },
    required: ['postId'],
  },
};

export async function handleRejectPost(args: { postId: string; notes?: string }): Promise<{
  success: boolean;
  postId: string;
  status: string;
  notes?: string;
}> {
  try {
    await connectToDB();

    const post = await Post.findById(args.postId);
    if (!post) {
      throw new Error(`Post not found: ${args.postId}`);
    }

    if (post.status !== 'PENDING') {
      throw new Error(`Post is already ${post.status}`);
    }

    // Update post
    post.status = 'REJECTED';
    post.notes = args.notes || 'Rejected by moderator';
    await post.save();

    return {
      success: true,
      postId: post._id.toString(),
      status: post.status,
      notes: post.notes,
    };
  } catch (error: any) {
    throw new Error(`Failed to reject post: ${error.message}`);
  }
}

