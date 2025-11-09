import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import Post from '@/models/Post';
import User from '@/models/User'; // Required for populate

export const runtime = 'nodejs';

/**
 * GET /api/admin/pending
 * Fetch all pending posts for moderation
 */
export async function GET() {
  try {
    await connectToDB();
    
    // Ensure User model is registered (required for populate)
    if (!User) {
      throw new Error('User model not loaded');
    }

    const posts = await Post.find({ status: 'PENDING' })
      .populate('userId', 'handle')
      .sort({ createdAt: 1 }) // Oldest first
      .limit(50)
      .lean();

    return NextResponse.json({
      ok: true,
      count: posts.length,
      posts,
    });
  } catch (error: any) {
    console.error('Error fetching pending posts:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch pending posts', message: error.message },
      { status: 500 }
    );
  }
}

