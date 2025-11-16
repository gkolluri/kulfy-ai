import FormData from 'form-data';

function getPinataConfig() {
  const PINATA_JWT = process.env.PINATA_JWT;
  const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud';

  if (!PINATA_JWT) {
    throw new Error('PINATA_JWT is not defined in environment variables');
  }

  return { PINATA_JWT, PINATA_GATEWAY };
}

export interface PinataUploadResponse {
  cid: string;
}

/**
 * Upload a file buffer to Pinata IPFS
 */
export async function pinFileToPinata(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<PinataUploadResponse> {
  try {
    const { PINATA_JWT } = getPinataConfig();
    
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: mimeType,
    });
    
    const metadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        app: 'kulfy',
        type: 'meme',
        public: 'true'
      }
    });
    formData.append('pinataMetadata', metadata);
    
    const options = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', options);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
        ...formData.getHeaders(),
      },
      body: formData as any,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const cid = result.IpfsHash || result.cid;
    
    if (!cid) {
      throw new Error('Invalid response from Pinata: missing CID');
    }

    return { cid };
  } catch (error: any) {
    throw new Error(`Pinata upload error: ${error.message}`);
  }
}


