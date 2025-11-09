import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { isSafeContent } from '@/lib/moderate';
import { getAutoTags } from '@/lib/tags';
import Post from '@/models/Post';
import Tag from '@/models/Tag';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectToDB();

    // Fetch up to 25 PENDING posts, oldest first
    const pendingPosts = await Post.find({ status: 'PENDING' })
      .sort({ createdAt: 1 })
      .limit(25);

    console.log(`[AGENT] Found ${pendingPosts.length} pending posts to process`);

    let processed = 0;

    for (const post of pendingPosts) {
      try {
        console.log(`[AGENT] Processing post ${post._id} (CID: ${post.cid})`);

        // Check if content is safe
        const isSafe = await isSafeContent(post.cid);

        if (!isSafe) {
          // Mark as REJECTED
          post.status = 'REJECTED';
          post.notes = 'Content flagged by moderation system';
          await post.save();
          console.log(`[AGENT] Post ${post._id} REJECTED`);
          processed++;
          continue;
        }

        // Get auto-generated tags
        const tagNames = await getAutoTags(post.cid);

        // Upsert tags and collect their IDs
        const tagIds = [];
        for (const tagName of tagNames) {
          let tag = await Tag.findOne({ name: tagName.toLowerCase() });
          if (!tag) {
            tag = await Tag.create({ name: tagName.toLowerCase() });
            console.log(`[AGENT] Created new tag: ${tagName}`);
          }
          tagIds.push(tag._id);
        }

        // Update post with tags and approve
        post.tags = tagIds;
        post.status = 'APPROVED';
        await post.save();
        
        console.log(`[AGENT] Post ${post._id} APPROVED with tags: ${tagNames.join(', ')}`);
        processed++;

      } catch (error) {
        console.error(`[AGENT] Error processing post ${post._id}:`, error);
        // Continue with next post even if this one fails
      }
    }

    return NextResponse.json({
      ok: true,
      processed,
      message: `Successfully processed ${processed} post(s)`,
    });

  } catch (error: any) {
    console.error('[AGENT] Error:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Agent run failed', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}

