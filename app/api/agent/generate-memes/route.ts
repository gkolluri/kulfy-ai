/**
 * Next.js API Route: /api/agent/generate-memes
 * 
 * Triggers the Python FastAPI service to generate Telugu memes.
 * 
 * This endpoint acts as a proxy between the Next.js frontend and the
 * Python LangGraph agent service. It calls the FastAPI service which:
 * 1. Scrapes greatandhra.com
 * 2. Generates meme concepts with GPT-4
 * 3. Creates images with DALL-E 3
 * 4. Uploads memes to Kulfy via /api/upload
 * 
 * Usage:
 *   POST /api/agent/generate-memes
 *   { "count": 5 }
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes timeout for Vercel Pro

const KULFY_AGENT_URL = process.env.KULFY_AGENT_URL || 'http://localhost:8001';

interface GenerateMemesRequest {
  count?: number;
  urls?: string[];
  custom_prompts?: Array<{
    title?: string;
    text_overlay: string;
    visual_description: string;
  }>;
}

interface GenerateMemesResponse {
  success: boolean;
  message: string;
  job_id?: string;
  status: string;
}

/**
 * POST /api/agent/generate-memes
 * Trigger meme generation via Python agent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GenerateMemesRequest;
    const count = body.count || 5;
    const urls = body.urls || [];
    const custom_prompts = body.custom_prompts;

    console.log(`[GENERATE_MEMES] Triggering Kulfy agent for ${count} memes with ${urls.length} URLs...`);
    if (custom_prompts) {
      console.log(`[GENERATE_MEMES] Using ${custom_prompts.length} custom prompts`);
    }

    // Call Kulfy Agent FastAPI service
    const response = await fetch(`${KULFY_AGENT_URL}/generate-memes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ count, urls, custom_prompts }),
      // No timeout here - let Vercel's maxDuration handle it
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GENERATE_MEMES] Kulfy agent error:`, errorText);
      
      return NextResponse.json(
        {
          ok: false,
          error: 'Agent service error',
          message: `Kulfy agent returned ${response.status}: ${errorText}`,
        },
        { status: response.status }
      );
    }

    const result = await response.json() as GenerateMemesResponse;

    console.log(`[GENERATE_MEMES] Agent response:`, result);

    return NextResponse.json({
      ok: true,
      message: result.message,
      status: result.status,
      job_id: result.job_id,
    });

  } catch (error: any) {
    console.error('[GENERATE_MEMES] Error:', error);

    // Check if Kulfy agent service is unreachable
    if (error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Agent service unavailable',
          message: 'Kulfy agent service is not running. Start it with: cd kulfy-agent && uvicorn main:app --reload',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
        message: error.message || 'Failed to trigger meme generation',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent/generate-memes
 * Get current agent status
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[GENERATE_MEMES] Checking agent status...');

    const response = await fetch(`${KULFY_AGENT_URL}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Agent status check failed: ${response.status}`);
    }

    const status = await response.json();

    return NextResponse.json({
      ok: true,
      ...status,
    });

  } catch (error: any) {
    console.error('[GENERATE_MEMES] Status check error:', error);

      return NextResponse.json(
        {
          ok: false,
          error: 'Agent service unavailable',
          message: 'Could not reach Kulfy agent service',
        },
        { status: 503 }
      );
  }
}

