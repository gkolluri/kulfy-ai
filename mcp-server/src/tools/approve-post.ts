import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { connectToDB } from '../utils/db.js';
import Post from '../models/Post.js';
import Tag from '../models/Tag.js';

export const approvePostTool: Tool = {
  name: 'approve_post',
  description: 'Approve a pending post. Automatically adds auto-generated tags. Returns the updated post status.',
  inputSchema: {
    type: 'object',
    properties: {
      postId: {
        type: 'string',
        description: 'The ID of the post to approve',
      },
    },
    required: ['postId'],
  },
};

export async function handleApprovePost(args: { postId: string }): Promise<{
  success: boolean;
  postId: string;
  status: string;
  tags: string[];
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

    // Auto-tag with stub tags (in production, use AI vision model)
    const tagNames = ['kulfy', 'meme', 'telugu'];
    
    // Upsert tags and get their IDs
    const tagIds = await Promise.all(
      tagNames.map(async (name) => {
        const tag = await Tag.findOneAndUpdate(
          { name: name.toLowerCase() },
          { name: name.toLowerCase() },
          { upsert: true, new: true }
        );
        return tag._id;
      })
    );

    // Update post
    post.status = 'APPROVED';
    post.tags = tagIds;
    await post.save();

    return {
      success: true,
      postId: post._id.toString(),
      status: post.status,
      tags: tagNames,
    };
  } catch (error: any) {
    throw new Error(`Failed to approve post: ${error.message}`);
  }
}


