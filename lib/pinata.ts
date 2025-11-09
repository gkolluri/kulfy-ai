function getPinataConfig() {
  const PINATA_JWT = process.env.PINATA_JWT;
  const PINATA_GATEWAY = process.env.PINATA_GATEWAY;

  if (!PINATA_JWT) {
    throw new Error('PINATA_JWT is not defined in environment variables');
  }

  if (!PINATA_GATEWAY) {
    throw new Error('PINATA_GATEWAY is not defined in environment variables');
  }

  return { PINATA_JWT, PINATA_GATEWAY };
}

export interface PinataUploadResponse {
  cid: string;
}

/**
 * Upload a file to Pinata IPFS using the v2 API (pinFileToIPFS - PUBLIC)
 * This endpoint creates publicly accessible files by default
 * @param file - The file to upload
 * @returns The CID of the uploaded file
 */
export async function pinFileToPinata(file: File): Promise<PinataUploadResponse> {
  try {
    const { PINATA_JWT } = getPinataConfig();
    
    console.log('[PINATA] Uploading file to Pinata IPFS (PUBLIC v2 API)...');
    console.log('[PINATA] File:', file.name, file.type, file.size, 'bytes');
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata for organization
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        app: 'kulfy',
        type: 'meme',
        public: 'true'
      }
    });
    formData.append('pinataMetadata', metadata);
    
    // Add pinata options
    const options = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', options);

    // Use v2 API endpoint which is for PUBLIC files
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });

    console.log('[PINATA] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PINATA] Upload failed:', errorText);
      throw new Error(`Pinata upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[PINATA] Response:', JSON.stringify(result));
    
    // v2 API returns IpfsHash directly
    const cid = result.IpfsHash || result.cid;
    
    if (!cid) {
      console.error('[PINATA] Invalid response format:', result);
      throw new Error('Invalid response from Pinata: missing CID');
    }

    console.log('[PINATA] Upload successful, CID:', cid);
    console.log('[PINATA] Public URL: https://gateway.pinata.cloud/ipfs/' + cid);
    console.log('[PINATA] ✅ File is PUBLIC - Test in incognito window!');
    
    return { cid };
  } catch (error: any) {
    console.error('[PINATA] Error uploading to Pinata:', error);
    throw error;
  }
}

/**
 * Convert a CID to a proxied image URL
 * Uses Next.js API route to handle gateway authentication
 * @param cid - The IPFS CID
 * @returns The proxied image URL
 */
export function cidToUrl(cid: string): string {
  // Use API proxy to avoid exposing gateway key to client
  return `/api/image/${cid}`;
}

