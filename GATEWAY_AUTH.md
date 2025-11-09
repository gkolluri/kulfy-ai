# 🔐 Pinata Gateway Authentication Fix

## Problem

Getting `401 Unauthorized` errors when loading images from your dedicated Pinata gateway:

```
GET https://white-immense-bedbug-311.mypinata.cloud/ipfs/bafybeib... 401 (Unauthorized)
```

This happens because your dedicated gateway requires authentication, but browsers can't send the `PINATA_GATEWAY_KEY` directly due to CORS restrictions.

## Solution Implemented: API Image Proxy ✅

I've created an API proxy route that handles authentication server-side:

### How It Works

1. **Browser** requests: `/api/image/[cid]`
2. **Next.js API** adds `PINATA_GATEWAY_KEY` header
3. **Pinata Gateway** returns authenticated image
4. **Next.js API** forwards image to browser

### Files Updated

- ✅ **`app/api/image/[cid]/route.ts`** - New image proxy API
- ✅ **`lib/pinata.ts`** - Updated `cidToUrl()` to use proxy
- ✅ **`app/admin/page.tsx`** - Uses proxy for image URLs

### Benefits

✅ **Secure**: Gateway key never exposed to client  
✅ **Fast**: Includes caching (1 hour)  
✅ **Compatible**: Works with all browsers  
✅ **Simple**: No changes needed elsewhere  

## Test It

1. **Restart your server**:
   ```bash
   npm run dev:watch
   ```

2. **Go to admin page**:
   ```
   http://localhost:3000/admin
   ```

3. **Images should load** without 401 errors! ✅

## Alternative: Make Gateway Public

If you prefer to make your gateway public (no authentication needed):

### Option 1: Via Pinata Dashboard

1. Go to [Pinata Dashboard](https://app.pinata.cloud/gateway)
2. Select your gateway: `white-immense-bedbug-311.mypinata.cloud`
3. Settings → Access Control
4. Set to **"Public"** (no authentication required)
5. Save changes

### Option 2: Update Gateway Settings via API

```bash
# Make gateway public
curl -X PUT https://api.pinata.cloud/v3/ipfs/gateway_config \
  -H "Authorization: Bearer YOUR_PINATA_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "gateway_id": "YOUR_GATEWAY_ID",
    "access_token_required": false
  }'
```

## Which Solution Should You Use?

### Use API Proxy (Implemented) If:
- ✅ You want tighter access control
- ✅ You want usage tracking through your API
- ✅ You might want to add rate limiting later
- ✅ You want server-side caching

### Make Gateway Public If:
- ✅ You want maximum performance
- ✅ You want simplicity
- ✅ Content is truly public anyway
- ✅ You want to use CDNs directly

## Current Configuration

Your app now uses the **API proxy approach** by default. This is more secure and gives you better control.

If you later make your gateway public, you can revert the changes:

```typescript
// In lib/pinata.ts
export function cidToUrl(cid: string): string {
  const { PINATA_GATEWAY } = getPinataConfig();
  return `https://${PINATA_GATEWAY}/ipfs/${cid}`;
}
```

## Troubleshooting

### Still getting 401 errors?

1. **Check environment variable**:
   ```bash
   # Make sure PINATA_GATEWAY_KEY is in .env.local
   echo $PINATA_GATEWAY_KEY
   ```

2. **Restart the server**:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev:watch
   ```

3. **Check API logs**:
   - Look for `[IMAGE_PROXY]` logs in terminal
   - Check for authentication errors

### Images not loading at all?

1. **Check the API route exists**:
   ```bash
   curl http://localhost:3000/api/image/bafybeib7i2igeihbgs46rpxfklgcyef75f2kjzxaavrr2ulzvdnpks5w7e
   ```

2. **Verify CID is correct**:
   - Test CID directly on public gateway
   - https://gateway.pinata.cloud/ipfs/YOUR_CID

### Gateway key invalid?

If the gateway key is wrong or expired:

1. Go to [Pinata Dashboard](https://app.pinata.cloud)
2. API Keys → Create new Gateway Access Token
3. Update `PINATA_GATEWAY_KEY` in `.env.local`
4. Restart server

## Production Deployment

The API proxy works seamlessly on Vercel! Just ensure:

1. **Add env var to Vercel**:
   ```
   PINATA_GATEWAY_KEY=Y7nATUn2NRrhdim6WrN_UxgJT2DOQw6lGPlMjgpCwQy_wK5nUtd0tppLgfYBvHvL
   ```

2. **Redeploy** after adding the env var

3. **Test production** images load correctly

## Performance Notes

The API proxy includes:
- ✅ **Caching**: 1 hour revalidation (Next.js)
- ✅ **Immutable headers**: Browser caches forever
- ✅ **Streaming**: Direct pass-through (no buffering)
- ✅ **CDN-friendly**: Works with Vercel Edge Network

## Summary

✅ **Problem**: Dedicated gateway requires authentication  
✅ **Solution**: API proxy handles auth server-side  
✅ **Result**: Images load securely without exposing keys  
✅ **Status**: Ready to use! Restart server to test  

---

Need help? Check the main [README.md](./README.md) or [TROUBLESHOOTING.md](./docs/archive/TROUBLESHOOTING.md).

