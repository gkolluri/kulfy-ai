# Kulfy Agent Deployment Guide

The Kulfy AI Agent is a Python FastAPI service that should be deployed separately from the Next.js frontend.

## ⚠️ Why Not Vercel?

Vercel is optimized for Node.js serverless functions with short execution times. The Kulfy Agent:
- Takes 3-5 minutes to generate memes (exceeds Vercel's timeout limits)
- Uses heavy Python dependencies (LangGraph, OpenAI, BeautifulSoup)
- Needs stateful storage for logs and status tracking
- Is a full FastAPI application, not a simple serverless function

**Recommendation**: Deploy the agent to Railway, Render, or Fly.io, and keep the Next.js app on Vercel.

---

## 🚀 Option 1: Deploy to Railway (Recommended - Easiest)

Railway is perfect for Python services and has a generous free tier.

### Steps:

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `kulfy-ai` repository
   - Railway will detect the `kulfy-agent` directory

3. **Configure Root Directory**
   - In project settings, set **Root Directory**: `kulfy-agent`

4. **Set Environment Variables**
   - Go to "Variables" tab
   - Add:
     ```
     OPENAI_API_KEY=sk-...your-key...
     KULFY_UPLOAD_URL=https://kulfy-ai.vercel.app/api/upload
     PORT=8000
     HOST=0.0.0.0
     ```

5. **Deploy**
   - Railway will automatically:
     - Detect Python
     - Install dependencies from `requirements.txt`
     - Run `uvicorn main:app --host 0.0.0.0 --port $PORT`

6. **Get Your Service URL**
   - Railway will provide a public URL like: `https://kulfy-agent.up.railway.app`
   - Copy this URL

7. **Update Next.js Environment Variables**
   - In Vercel dashboard for your Next.js app:
     - Add: `KULFY_AGENT_URL=https://kulfy-agent.up.railway.app`
   - Redeploy your Next.js app

---

## 🚀 Option 2: Deploy to Render

Render also has a free tier and is very reliable.

### Steps:

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `kulfy-ai` repo

3. **Configure Service**
   - **Name**: `kulfy-agent`
   - **Root Directory**: `kulfy-agent`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free (or paid for better performance)

4. **Environment Variables**
   - Add:
     ```
     OPENAI_API_KEY=sk-...
     KULFY_UPLOAD_URL=https://kulfy-ai.vercel.app/api/upload
     ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Get your service URL: `https://kulfy-agent.onrender.com`

6. **Update Next.js App**
   - Add `KULFY_AGENT_URL` to Vercel environment variables

---

## 🚀 Option 3: Deploy to Fly.io

Fly.io is great for Docker-based deployments.

### Steps:

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to Fly**
   ```bash
   fly auth login
   ```

3. **Create Fly App**
   ```bash
   cd kulfy-agent
   fly launch --name kulfy-agent
   ```

4. **Set Environment Variables**
   ```bash
   fly secrets set OPENAI_API_KEY=sk-...
   fly secrets set KULFY_UPLOAD_URL=https://kulfy-ai.vercel.app/api/upload
   ```

5. **Deploy**
   ```bash
   fly deploy
   ```

6. **Get URL**
   ```bash
   fly status
   ```
   - Your URL: `https://kulfy-agent.fly.dev`

---

## 🔧 Architecture

```
┌─────────────────────────────────────────┐
│  Next.js Frontend                       │
│  (Vercel)                               │
│  https://kulfy-ai.vercel.app            │
│                                         │
│  - User Interface                       │
│  - API Routes                           │
│  - MongoDB Connection                   │
└──────────────┬──────────────────────────┘
               │ HTTP Requests
               │ (Triggers meme generation)
               │
               ▼
┌─────────────────────────────────────────┐
│  Python FastAPI Agent                   │
│  (Railway/Render/Fly.io)                │
│  https://kulfy-agent.up.railway.app     │
│                                         │
│  - LangGraph Workflow                   │
│  - GPT-4 Analysis                       │
│  - DALL-E 3 Image Generation            │
│  - Content Fetching                     │
│                                         │
│  Uploads generated memes back to ────►  │
│  Next.js /api/upload endpoint           │
└─────────────────────────────────────────┘
```

---

## 🎯 Summary

1. **Deploy Next.js app to Vercel** (already done ✅)
2. **Deploy Python agent to Railway/Render/Fly.io** (choose one)
3. **Update `KULFY_AGENT_URL` in Vercel** environment variables
4. **Redeploy Next.js app** to pick up the new environment variable

This architecture gives you:
- ✅ Fast Next.js serving (Vercel edge network)
- ✅ Reliable long-running Python processes (Railway/Render/Fly.io)
- ✅ Scalability (each service scales independently)
- ✅ Free tier available on all platforms

---

## 💰 Cost Comparison

| Platform | Free Tier | Notes |
|----------|-----------|-------|
| **Railway** | $5 free credits/month | ~500 hours of runtime |
| **Render** | 750 hours/month | Spins down after 15 min inactivity |
| **Fly.io** | 3 shared VMs | 160GB data transfer |

**Recommendation**: Start with **Railway** - it's the easiest and most generous free tier.

---

## 🔐 Security Notes

- Never commit `.env` files
- Use environment variables for all secrets
- The agent URL can be public (it's called by your Next.js backend)
- Rate limit the `/generate-memes` endpoint if needed

---

## 📊 Monitoring

All platforms provide:
- Real-time logs
- Metrics (CPU, memory, requests)
- Deployment history
- Automatic HTTPS

---

## 🚨 Troubleshooting

### Build Fails
- Check `requirements.txt` compatibility
- Ensure Python 3.9+ is specified
- Look for missing system dependencies

### Timeout Errors
- Increase timeout in platform settings
- Railway: No timeout on paid plan
- Render: 60-second timeout on free tier (upgrade for longer)

### Out of Memory
- Upgrade to paid plan for more RAM
- Optimize dependencies (remove unused packages)

### Connection Refused
- Check `HOST=0.0.0.0` (not `127.0.0.1`)
- Ensure `PORT` environment variable is used
- Verify firewall rules

---

## 🎉 That's It!

Once deployed, your agent will be accessible at your platform's URL, and your Next.js app will call it to generate memes!

Any questions? Check the platform-specific documentation or open an issue.

