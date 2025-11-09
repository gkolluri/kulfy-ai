import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import Post from '@/models/Post';
import Tag from '@/models/Tag';
import { getAutoTags } from '@/lib/tags';

export const runtime = 'nodejs';

/**
 * POST /api/admin/approve
 * Approve a single post by ID
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDB();

    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { ok: false, error: 'Missing postId' },
        { status: 400 }
      );
    }

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json(
        { ok: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.status !== 'PENDING') {
      return NextResponse.json(
        { ok: false, error: `Post is already ${post.status}` },
        { status: 400 }
      );
    }

    // Get auto-tags
    const tagNames = await getAutoTags(post.cid);
    
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

    console.log(`✅ Post ${postId} approved with tags:`, tagNames);

    return NextResponse.json({
      ok: true,
      postId: post._id,
      status: post.status,
      tags: tagNames,
    });
  } catch (error: any) {
    console.error('Error approving post:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to approve post', message: error.message },
      { status: 500 }
    );
  }
}

