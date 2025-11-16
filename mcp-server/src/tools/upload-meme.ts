import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { connectToDB } from '../utils/db.js';
import { pinFileToPinata } from '../utils/pinata.js';
import User from '../models/User.js';
import Post from '../models/Post.js';

export const uploadMemeTool: Tool = {
  name: 'upload_meme',
  description: 'Upload a meme image to Kulfy. Accepts base64-encoded image data and optional title. Returns the post ID and IPFS CID.',
  inputSchema: {
    type: 'object',
    properties: {
      imageData: {
        type: 'string',
        description: 'Base64-encoded image data (with data URI prefix, e.g., data:image/png;base64,...)',
      },
      title: {
        type: 'string',
        description: 'Optional title for the meme (max 140 characters)',
        maxLength: 140,
      },
      sourceUrl: {
        type: 'string',
        description: 'Optional source URL where this meme was created from',
      },
    },
    required: ['imageData'],
  },
};

export async function handleUploadMeme(args: {
  imageData: string;
  title?: string;
  sourceUrl?: string;
}): Promise<{ postId: string; cid: string; message: string }> {
  try {
    // Parse base64 image data
    const base64Match = args.imageData.match(/^data:([^;]+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error('Invalid image data format. Expected data URI with base64 encoding.');
    }

    const mimeType = base64Match[1];
    const base64Data = base64Match[2];

    // Validate MIME type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(mimeType)) {
      throw new Error(`Invalid image type: ${mimeType}. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(base64Data, 'base64');
    
    // Validate file size (6MB max)
    if (fileBuffer.length > 6 * 1024 * 1024) {
      throw new Error('File size exceeds 6MB limit');
    }

    // Upload to Pinata
    const fileName = `meme_${Date.now()}.${mimeType.split('/')[1]}`;
    const { cid } = await pinFileToPinata(fileBuffer, fileName, mimeType);

    // Connect to database
    await connectToDB();

    // Upsert demo user
    let user = await User.findOne({ handle: 'demo' });
    if (!user) {
      user = await User.create({ handle: 'demo' });
    }

    // Create post
    const post = await Post.create({
      cid,
      title: args.title || undefined,
      mime: mimeType,
      userId: user._id,
      status: 'PENDING',
      sourceUrl: args.sourceUrl || undefined,
    });

    return {
      postId: post._id.toString(),
      cid,
      message: `Meme uploaded successfully. Post ID: ${post._id}, CID: ${cid}, Status: PENDING`,
    };
  } catch (error: any) {
    throw new Error(`Failed to upload meme: ${error.message}`);
  }
}


