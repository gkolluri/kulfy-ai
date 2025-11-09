import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDB } from '@/lib/db';
import { pinFileToPinata } from '@/lib/pinata';
import User from '@/models/User';
import Post from '@/models/Post';

export const runtime = 'nodejs';

// Validation schema
const uploadSchema = z.object({
  title: z.string().max(140).optional(),
  file: z.object({
    type: z.enum(['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
    size: z.number().max(6 * 1024 * 1024), // 6MB max
  }),
});

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const title = formData.get('title') as string | null;
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = uploadSchema.safeParse({
      title: title || undefined,
      file: {
        type: file.type,
        size: file.size,
      },
    });

    if (!validation.success) {
      const errors = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return NextResponse.json(
        { ok: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Upload to Pinata
    console.log(`[UPLOAD] Uploading file to Pinata: ${file.name} (${file.type}, ${file.size} bytes)`);
    const { cid } = await pinFileToPinata(file);
    console.log(`[UPLOAD] File uploaded successfully. CID: ${cid}`);

    // Connect to MongoDB
    await connectToDB();

    // Upsert demo user
    let user = await User.findOne({ handle: 'demo' });
    if (!user) {
      user = await User.create({ handle: 'demo' });
      console.log('[UPLOAD] Created demo user');
    }

    // Create post with PENDING status
    const post = await Post.create({
      cid,
      title: title || undefined,
      mime: file.type,
      userId: user._id,
      status: 'PENDING',
    });

    console.log(`[UPLOAD] Post created with ID: ${post._id}, status: ${post.status}`);

    return NextResponse.json({
      ok: true,
      id: post._id.toString(),
      cid,
      message: 'File uploaded successfully. Pending moderation.',
    });

  } catch (error: any) {
    console.error('[UPLOAD] Error:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Upload failed', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}

