# 🔧 Troubleshooting Guide

## Upload Error: 500 Internal Server Error

If you're getting a 500 error when uploading, follow these steps:

### Step 1: Check Server Logs

Look at your terminal where `npm run dev` is running. You should see error messages like:

```
[UPLOAD] Error: ...
[PINATA] Upload failed: ...
```

### Step 2: Verify Environment Variables

Make sure `.env.local` exists and has the correct values:

```bash
cat .env.local
```

You should see:
```env
MONGODB_URI=mongodb+srv://...
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PINATA_GATEWAY=gateway.pinata.cloud
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Restart Dev Server

After creating/updating `.env.local`, you MUST restart the server:

```bash
# Stop the server (Ctrl+C)
# Then start again
npm run dev
```

### Step 4: Test Pinata API

Test your Pinata JWT token:

```bash
curl -X POST "https://uploads.pinata.cloud/v3/files" \
  -H "Authorization: Bearer YOUR_PINATA_JWT" \
  -F "file=@/path/to/test-image.png"
```

Replace `YOUR_PINATA_JWT` with your actual JWT from `.env.local`.

### Step 5: Test MongoDB Connection

Check if MongoDB is reachable:

```bash
# Install mongosh if you don't have it
# Then test connection
mongosh "mongodb+srv://girishkolluri_db_user:QlEuajJi4ZadokyH@kulfycluster.et4uacl.mongodb.net/kulfy"
```

## Common Issues

### Issue 1: "PINATA_JWT is not defined"

**Cause**: `.env.local` file doesn't exist or isn't being loaded

**Fix**:
1. Make sure `.env.local` exists in the project root
2. Restart the dev server
3. Check that the file has no typos (it's `.env.local` not `.env`)

### Issue 2: "Pinata upload failed: 401"

**Cause**: Invalid or expired JWT token

**Fix**:
1. Go to https://app.pinata.cloud/developers/api-keys
2. Generate a new API key
3. Update `PINATA_JWT` in `.env.local`
4. Restart the dev server

### Issue 3: "MongoDB connection failed"

**Cause**: Network issue or wrong connection string

**Fix**:
1. Check your internet connection
2. Verify the MongoDB URI in `.env.local`
3. Check MongoDB Atlas Network Access allows your IP
4. Try connecting with mongosh to test

### Issue 4: "Pinata upload failed: 413"

**Cause**: File too large

**Fix**:
- Maximum file size is 6MB
- Try with a smaller image
- Compress your image before uploading

### Issue 5: "Invalid file type"

**Cause**: Unsupported file format

**Fix**:
- Only PNG, JPEG, WebP, and GIF are supported
- Convert your image to a supported format

## Debug Mode

Enable detailed logging by checking the server console. After each upload attempt, you should see:

```
[UPLOAD] Uploading file to Pinata: filename.png (image/png, 123456 bytes)
[PINATA] Uploading file to Pinata IPFS...
[PINATA] Response status: 200
[PINATA] Upload successful, CID: bafkreixxx...
[UPLOAD] File uploaded successfully. CID: bafkreixxx...
✅ MongoDB connected successfully
[UPLOAD] Post created with ID: 673e...
```

If you see an error at any step, that's where the problem is.

## Test Without UI

You can test the upload API directly with curl:

```bash
# Test upload endpoint
curl -X POST http://localhost:3000/api/upload \
  -F "title=Test Upload" \
  -F "file=@/path/to/image.png"
```

Expected response:
```json
{
  "ok": true,
  "id": "673e...",
  "cid": "bafkreixxx...",
  "message": "File uploaded successfully. Pending moderation."
}
```

## Still Having Issues?

1. **Check the exact error message** in the server console
2. **Copy the full error** and check if it mentions:
   - MongoDB connection
   - Pinata API
   - File validation
   - Environment variables

3. **Verify your setup**:
   ```bash
   # Check Node version (should be 18+)
   node --version
   
   # Check if .env.local exists
   ls -la .env.local
   
   # Check dependencies
   npm list mongoose zod
   ```

4. **Try a clean rebuild**:
   ```bash
   # Stop the server
   # Clear cache
   rm -rf .next
   
   # Rebuild
   npm run build
   
   # Start dev server
   npm run dev
   ```

## Get More Help

If none of these solutions work, please provide:
1. The exact error message from the server console
2. Your Node.js version (`node --version`)
3. Whether `.env.local` exists and has content
4. The output of `npm list` to check dependencies

---

**Most Common Fix**: Restart the dev server after creating/updating `.env.local` ✅

