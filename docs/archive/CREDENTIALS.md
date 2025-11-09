# 🔐 Kulfy Credentials Reference

**⚠️ IMPORTANT: Keep this file secure and never commit it to Git!**

## ✅ Configured Credentials

All credentials have been configured in `.env.local` and are ready to use.

### MongoDB Atlas
```
Database: kulfy
Collection: kulfys (auto-created)
Connection String: Configured in .env.local
```

### Pinata IPFS
```
API Key: cb364cbf513d4fed4ec2
API Secret: e7efb2d41278c056e662598419c9eac8a427fca2e0a577574ea5fb8d832de88d
JWT: Configured in .env.local (Updated)
Gateway: gateway.pinata.cloud (public gateway)
Status: ✅ ACTIVE
```

**Note:** You're using the public Pinata gateway. For production, consider setting up a dedicated gateway:
1. Go to https://app.pinata.cloud/gateway
2. Create a dedicated gateway (e.g., `yourname.mypinata.cloud`)
3. Update `PINATA_GATEWAY` in `.env.local`

## 🚀 You're Ready to Go!

Your environment is fully configured. Run:

```bash
npm run dev
```

Then visit:
- **Home**: http://localhost:3000
- **Upload**: http://localhost:3000/upload
- **Feed**: http://localhost:3000/feed
- **Agent**: http://localhost:3000/api/agent/run

## 📝 Testing Flow

### 1. Upload an Image
```bash
# Go to http://localhost:3000/upload
# Select any image (PNG, JPEG, WebP, GIF)
# Click "Upload to IPFS"
# You'll get a success message with CID
```

### 2. Run the Moderation Agent
```bash
# Option A: Browser
curl http://localhost:3000/api/agent/run

# Option B: Terminal
curl http://localhost:3000/api/agent/run
```

Expected response:
```json
{
  "ok": true,
  "processed": 1,
  "message": "Successfully processed 1 post(s)"
}
```

### 3. View the Feed
```bash
# Go to http://localhost:3000/feed
# Your approved image will be displayed in a grid
```

## 🔧 Environment Variables

All configured in `.env.local`:

```env
MONGODB_URI=mongodb+srv://girishkolluri_db_user:...
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PINATA_GATEWAY=gateway.pinata.cloud
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🎯 API Endpoints

### Upload Image
```bash
POST /api/upload
Content-Type: multipart/form-data

Fields:
- title (optional): string, max 140 chars
- file (required): image file, max 6MB
```

Example with curl:
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "title=My First Kulfy Meme" \
  -F "file=@/path/to/image.png"
```

### Run Moderation Agent
```bash
GET /api/agent/run
```

Example with curl:
```bash
curl http://localhost:3000/api/agent/run
```

## 🔐 Security Notes

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Rotate keys regularly** - Generate new Pinata JWT periodically
3. **Use dedicated gateway in production** - For better performance and control
4. **Whitelist IPs on MongoDB Atlas** - For production, restrict to specific IPs
5. **Enable rate limiting** - Add rate limiting middleware for production

## 📊 Pinata Dashboard

Access your Pinata dashboard at:
- **Files**: https://app.pinata.cloud/pinmanager
- **API Keys**: https://app.pinata.cloud/developers/api-keys
- **Gateway**: https://app.pinata.cloud/gateway
- **Usage**: https://app.pinata.cloud/usage

## 🆘 Troubleshooting

### "Pinata upload failed"
- Verify JWT token is correct
- Check that file is under 6MB
- Ensure file type is supported (PNG, JPEG, WebP, GIF)

### "MongoDB connection failed"
- Verify connection string is correct
- Check MongoDB Atlas network access allows your IP
- Ensure database user has proper permissions

### "Cannot connect to database"
- Make sure `.env.local` exists
- Restart the dev server after adding credentials
- Check for typos in environment variables

## 🎉 Success Checklist

- [x] MongoDB connection configured
- [x] Pinata JWT configured
- [x] Pinata gateway configured
- [x] All dependencies installed
- [x] Build successful
- [ ] Dev server running
- [ ] First image uploaded
- [ ] Agent run successful
- [ ] Image visible in feed

**You're all set! Start building! 🍦**

