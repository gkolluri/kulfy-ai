# ⚡ Quick Start Guide

Get Kulfy running in under 5 minutes!

## Your MongoDB Connection

Your MongoDB Atlas connection is already configured:
```
mongodb+srv://girishkolluri_db_user:QlEuajJi4ZadokyH@kulfycluster.et4uacl.mongodb.net/kulfy?retryWrites=true&w=majority&appName=kulfycluster
```

- **Database**: kulfy
- **Collection**: kulfys (will be auto-created)

## What You Need To Do

### 1. Get Pinata Credentials

You need to sign up for Pinata and get:
1. **JWT Token** from https://app.pinata.cloud/developers/api-keys
2. **Gateway URL** from https://app.pinata.cloud/gateway

### 2. Create `.env.local`

Create a file named `.env.local` in the project root with:

```env
# MongoDB (already configured for you)
MONGODB_URI=mongodb+srv://girishkolluri_db_user:QlEuajJi4ZadokyH@kulfycluster.et4uacl.mongodb.net/kulfy?retryWrites=true&w=majority&appName=kulfycluster

# Pinata (you need to add these)
PINATA_JWT=YOUR_PINATA_JWT_HERE
PINATA_GATEWAY=yourname.mypinata.cloud

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Install & Run

```bash
# Install dependencies
npm install

# Start the app
npm run dev
```

Visit: http://localhost:3000

## Testing in 3 Steps

### Step 1: Upload an Image
1. Go to http://localhost:3000/upload
2. Select any image (PNG, JPEG, WebP, or GIF)
3. Click "Upload to IPFS"
4. Copy the CID from the success message

### Step 2: Run the Agent
Visit in browser or curl:
```bash
curl http://localhost:3000/api/agent/run
```

### Step 3: View the Feed
Go to http://localhost:3000/feed and see your meme!

## API Endpoints

- `POST /api/upload` - Upload a new image
- `GET /api/agent/run` - Process pending posts
- `GET /feed` - View approved posts
- `GET /upload` - Upload form page

## Project Structure

```
kulfy-ai/
├── app/
│   ├── api/
│   │   ├── upload/route.ts          # Upload endpoint
│   │   └── agent/run/route.ts       # Moderation agent
│   ├── upload/page.tsx              # Upload UI
│   ├── feed/page.tsx                # Feed UI
│   └── layout.tsx                   # App layout
├── models/
│   ├── User.ts                      # User schema
│   ├── Post.ts                      # Post schema
│   └── Tag.ts                       # Tag schema
├── lib/
│   ├── db.ts                        # MongoDB connection
│   ├── pinata.ts                    # Pinata helpers
│   ├── moderate.ts                  # Moderation (stub)
│   └── tags.ts                      # Auto-tagging (stub)
└── components/
    └── card.tsx                     # Image card component
```

## Troubleshooting

**"Cannot connect to MongoDB"**
- Your MongoDB is already configured, but verify network access allows your IP

**"Pinata upload failed"**
- Make sure you've set `PINATA_JWT` and `PINATA_GATEWAY` in `.env.local`
- Verify the JWT has pinning permissions

**"Module not found"**
```bash
npm install
```

## Next Steps

1. ✅ Get it running locally
2. 🎨 Upload some test memes
3. 🤖 Experiment with the moderation agent
4. 🚀 Deploy to Vercel
5. 🧠 Add real AI moderation and tagging (Week 2+)

---

Need more help? Check [SETUP.md](./SETUP.md) for detailed instructions!

