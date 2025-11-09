import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import Post from '@/models/Post';

export const runtime = 'nodejs';

/**
 * POST /api/admin/reject
 * Reject a single post by ID
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDB();

    const body = await request.json();
    const { postId, notes } = body;

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

    // Update post
    post.status = 'REJECTED';
    if (notes) {
      post.notes = notes;
    } else {
      post.notes = 'Rejected by moderator';
    }
    await post.save();

    console.log(`❌ Post ${postId} rejected`);

    return NextResponse.json({
      ok: true,
      postId: post._id,
      status: post.status,
    });
  } catch (error: any) {
    console.error('Error rejecting post:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to reject post', message: error.message },
      { status: 500 }
    );
  }
}

