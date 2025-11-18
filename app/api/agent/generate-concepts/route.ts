/**
 * Next.js API Route: /api/agent/generate-concepts
 * 
 * Phase 1: Generate meme concepts and DALL-E prompts only.
 * User can review and edit prompts before image generation.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes timeout

const KULFY_AGENT_URL = process.env.KULFY_AGENT_URL || 'http://localhost:8001';

interface GenerateConceptsRequest {
  urls?: string[];
}

/**
 * POST /api/agent/generate-concepts
 * Generate concepts and prompts only (phase 1)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GenerateConceptsRequest;
    const urls = body.urls || [];

    console.log(`[GENERATE_CONCEPTS] Triggering concept generation for ${urls.length} URLs...`);

    // Call Kulfy Agent FastAPI service
    const response = await fetch(`${KULFY_AGENT_URL}/generate-concepts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ urls }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GENERATE_CONCEPTS] Kulfy agent error:`, errorText);
      
      return NextResponse.json(
        {
          ok: false,
          error: 'Agent service error',
          message: `Kulfy agent returned ${response.status}: ${errorText}`,
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    console.log(`[GENERATE_CONCEPTS] Agent response:`, result);

    return NextResponse.json({
      ok: true,
      ...result,
    });

  } catch (error: any) {
    console.error('[GENERATE_CONCEPTS] Error:', error);

    if (error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Agent service unavailable',
          message: 'Kulfy agent service is not running.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
        message: error.message || 'Failed to trigger concept generation',
      },
      { status: 500 }
    );
  }
}



