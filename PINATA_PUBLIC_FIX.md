# 🔓 Making Pinata Files Public - Complete Guide

## Issue: Files Going to Private

If files are uploading but going to private, here's how to fix it:

### Option 1: Change Account Default Settings (Recommended)

1. **Go to Pinata Settings**:
   - Visit: https://app.pinata.cloud/account
   - Or: Dashboard → Account Settings

2. **Find "Default Pin Settings"** or **"Privacy Settings"**:
   - Look for "Default File Privacy" setting
   - Change from "Private" to "Public"
   - Save settings

3. **Restart your upload** - new files will be public

### Option 2: Make Existing Files Public (Bulk)

1. **Go to Files Manager**:
   - Visit: https://app.pinata.cloud/pinmanager

2. **Select your files**:
   - Check the boxes for files you want to make public
   - Or use "Select All" if you want all files public

3. **Change Privacy**:
   - Look for "Actions" or "..." menu
   - Click "Make Public" or toggle privacy setting
   - Confirm changes

### Option 3: Make Individual Files Public

1. **Go to Files**: https://app.pinata.cloud/pinmanager
2. **Click on a file**
3. **Find the privacy toggle** (usually 🔒 → 🔓)
4. **Click to make public**
5. **Verify** the file shows as public

### Option 4: Check API Key Permissions

Your API key might not have permission to create public files:

1. **Go to API Keys**: https://app.pinata.cloud/developers/api-keys
2. **Check your current key** (cb364cbf513d4fed4ec2)
3. **Verify permissions include**:
   - ✅ `pinFileToIPFS` (should be enabled)
   - ✅ Public file access (check if there's a setting)

4. **If needed, create a NEW key with full permissions**:
   - Click "New Key"
   - Enable "Admin" or all pin permissions
   - **Important**: Make sure "Allow Public Gateway Access" is enabled
   - Copy the new JWT
   - Update `.env.local` with new JWT

### Option 5: Use Pinata v2 API (For Public Uploads)

The v3 API might default to private. Let me update the code to use v2 which is explicitly for public files.

**I'll update this for you now...**

### How to Verify Files Are Public

After upload, test the URL in an **incognito window**:
```
https://gateway.pinata.cloud/ipfs/YOUR_CID
```

If you see:
- ✅ **Image loads** = Public ✅
- ❌ **Error/403** = Still private ❌

### Common Causes

1. **Account Setting**: Default privacy is set to "Private"
2. **API Key**: Doesn't have permission for public files
3. **Plan Limitation**: Free plan might restrict public files (unlikely)
4. **API Version**: v3 might default to private, v2 is explicitly public

### Quick Test

After uploading, run this in terminal:
```bash
# Replace YOUR_CID with actual CID
curl -I https://gateway.pinata.cloud/ipfs/YOUR_CID
```

**Expected**: `HTTP/2 200` = Public ✅
**Problem**: `HTTP/2 403` or `401` = Private ❌

---

Let me update the code to use the v2 API which is explicitly for public files...

