import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/image/[cid]
 * Proxy for authenticated Pinata gateway access
 * This allows the browser to load images without exposing the gateway key
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  try {
    const { cid } = await params;
    
    if (!cid) {
      return NextResponse.json(
        { error: 'Missing CID' },
        { status: 400 }
      );
    }

    const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'white-immense-bedbug-311.mypinata.cloud';
    const PINATA_GATEWAY_KEY = process.env.PINATA_GATEWAY_KEY;

    // Build the gateway URL
    const gatewayUrl = `https://${PINATA_GATEWAY}/ipfs/${cid}`;

    // Fetch from Pinata with authentication
    const headers: HeadersInit = {};
    if (PINATA_GATEWAY_KEY) {
      headers['x-pinata-gateway-token'] = PINATA_GATEWAY_KEY;
    }

    const response = await fetch(gatewayUrl, {
      headers,
      // Cache the response for 1 hour
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.error(`[IMAGE_PROXY] Failed to fetch ${cid}:`, response.status);
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('[IMAGE_PROXY] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

