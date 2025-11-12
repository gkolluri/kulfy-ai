# Deploy Kulfy Agent to Render

## 🚀 Quick Deployment Steps

### 1. Create Render Account
- Go to https://render.com
- Sign up with GitHub (easiest for auto-deployment)

### 2. Create New Web Service

1. **Click "New +"** in the top right
2. Select **"Web Service"**
3. **Connect GitHub Repository**:
   - Click "Connect account" if first time
   - Select your `kulfy-ai` repository
   - Click "Connect"

### 3. Configure Service

Fill in the settings:

**Basic Settings:**
- **Name**: `kulfy-agent` (or any name you prefer)
- **Region**: Choose closest to you (Oregon, Frankfurt, Singapore, Ohio)
- **Branch**: `main` (or your default branch)
- **Root Directory**: `kulfy-agent` ⚠️ **IMPORTANT**
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Instance Type:**
- **Free** (starter tier - 512MB RAM, spins down after 15 min inactivity)
- Or **Starter** ($7/month - always on, 512MB RAM)

### 4. Add Environment Variables

Click "Advanced" → Add Environment Variables:

| Key | Value |
|-----|-------|
| `OPENAI_API_KEY` | `sk-...your-openai-key...` |
| `KULFY_UPLOAD_URL` | `https://kulfy-ai.vercel.app/api/upload` |
| `PYTHON_VERSION` | `3.9.18` |
| `HOST` | `0.0.0.0` |

⚠️ **IMPORTANT**: Don't commit your OpenAI API key! Add it only in Render's dashboard.

### 5. Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Install Python 3.9
   - Run `pip install -r requirements.txt`
   - Start your FastAPI app
   - Give you a public URL

**First deployment takes ~5-10 minutes.**

### 6. Get Your Service URL

Once deployed, you'll see:
```
https://kulfy-agent.onrender.com
```

Or with your custom name:
```
https://kulfy-agent-[random-string].onrender.com
```

**Copy this URL!**

### 7. Update Next.js App on Vercel

1. Go to https://vercel.com/dashboard
2. Select your `kulfy-ai` project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Key**: `KULFY_AGENT_URL`
   - **Value**: `https://kulfy-agent.onrender.com` (your Render URL)
   - **Environment**: Production, Preview, Development (select all)
5. Click **Save**
6. Go to **Deployments**
7. Click on latest deployment → **⋯ Menu** → **Redeploy**

### 8. Test It!

1. Go to `https://kulfy-ai.vercel.app/generate`
2. Paste a news URL
3. Click "Generate 5 Memes Now"
4. Watch the live logs! 🎉

---

## 🔍 Monitoring & Logs

### View Logs
- Go to your Render dashboard
- Click on `kulfy-agent` service
- Click "Logs" tab
- See real-time logs from your FastAPI app

### Check Status
- **Healthy**: Green dot, service is running
- **Building**: Orange, deployment in progress
- **Failed**: Red, check logs for errors

### Service Info
- **Last Deploy**: When it was deployed
- **Health Check**: `/health` endpoint
- **Auto-Deploy**: Enabled (deploys on git push)

---

## ⚙️ Render Free Tier Limits

| Feature | Free Tier |
|---------|-----------|
| RAM | 512 MB |
| CPU | Shared |
| Bandwidth | 100 GB/month |
| Hours | 750 hours/month |
| Spin Down | After 15 min inactivity |
| Spin Up | ~30-60 seconds |

**Important**: Free tier services spin down after 15 minutes of inactivity. First request after spin-down will be slow (30-60s) while it wakes up.

---

## 🔧 Troubleshooting

### Build Fails

**Error**: "Command failed: pip install -r requirements.txt"

**Solution**:
- Check `requirements.txt` is valid
- Ensure Python 3.9+ compatibility
- Look at build logs for specific package errors

**Fix**:
```bash
# Test locally first
cd kulfy-agent
pip install -r requirements.txt
```

### Service Won't Start

**Error**: "Application failed to respond"

**Solution**:
- Verify `HOST=0.0.0.0` (not `127.0.0.1`)
- Check start command uses `$PORT` variable
- Ensure `main:app` path is correct
- Look for Python errors in logs

### Timeout on First Request

**Expected behavior on free tier!**
- Service spins down after 15 min
- First request wakes it up (~30-60s delay)
- Upgrade to Starter plan ($7/mo) for always-on

### Out of Memory

**Error**: "Process killed (OOM)"

**Solution**:
- Free tier has 512MB RAM
- Upgrade to Starter ($7/mo) or higher plan
- Or optimize dependencies (remove unused packages)

### Environment Variables Not Working

**Check**:
- Variables are added in Render dashboard (not in code)
- Variables are saved (click Save button)
- Service was redeployed after adding variables
- No typos in variable names

---

## 🚀 Upgrading to Paid Plan

Benefits of **Starter Plan** ($7/month):

✅ **Always On** (no spin-down)  
✅ **Faster Response** (no cold starts)  
✅ **512MB RAM** (same as free)  
✅ **Better Support**  

To upgrade:
1. Go to service settings
2. Change "Instance Type" from Free to Starter
3. Add payment method
4. Click Save

---

## 🔐 Security Best Practices

✅ **Do**:
- Use environment variables for secrets
- Keep OpenAI API key in Render dashboard only
- Use HTTPS (provided automatically by Render)
- Monitor logs for unusual activity

❌ **Don't**:
- Commit `.env` files to git
- Share your Render service URL publicly (unless you add authentication)
- Use the same OpenAI key for dev and prod

---

## 📊 Custom Domain (Optional)

Want a custom domain like `agent.kulfy.ai`?

1. Buy domain (Namecheap, GoDaddy, etc.)
2. In Render dashboard:
   - Go to your service
   - Click "Settings" → "Custom Domains"
   - Click "Add Custom Domain"
   - Enter: `agent.yourdomain.com`
3. Add CNAME record in your DNS:
   ```
   CNAME agent [your-render-url]
   ```
4. Wait for DNS propagation (~5-60 min)
5. Render auto-provisions SSL certificate

---

## 🔄 Auto-Deploy on Git Push

Render automatically redeploys when you push to GitHub!

**How it works**:
1. You push code to GitHub (`git push origin main`)
2. Render detects the push
3. Automatically rebuilds and redeploys
4. Takes ~3-5 minutes

**To disable**:
- Go to service settings
- Disable "Auto-Deploy"

---

## 📈 Performance Tips

### For Free Tier:
- Keep service "warm" by pinging `/health` every 10 minutes
- Use a service like [UptimeRobot](https://uptimerobot.com) (free)
- Accept 30-60s delay on first request after spin-down

### For Production:
- Upgrade to Starter plan ($7/mo)
- Use Starter+ for more RAM if needed
- Monitor with Render's built-in metrics

---

## 🆘 Support

**Render Support**:
- Docs: https://render.com/docs
- Community: https://community.render.com
- Email: support@render.com (paid plans)

**Kulfy Agent Issues**:
- Check logs in Render dashboard
- Test locally first: `uvicorn main:app --reload`
- Verify environment variables are set

---

## ✅ Deployment Checklist

- [ ] Render account created
- [ ] GitHub repository connected
- [ ] Root Directory set to `kulfy-agent`
- [ ] Build command: `pip install -r requirements.txt`
- [ ] Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] `OPENAI_API_KEY` environment variable added
- [ ] `KULFY_UPLOAD_URL` environment variable added
- [ ] Service deployed successfully
- [ ] Service URL copied
- [ ] `KULFY_AGENT_URL` added to Vercel
- [ ] Next.js app redeployed
- [ ] Tested meme generation

---

## 🎉 You're Done!

Your Kulfy Agent is now live on Render!

**Architecture**:
```
User → Next.js (Vercel) → Python Agent (Render) → OpenAI APIs
                ↓                                      ↓
             MongoDB                            Generated Memes
             Pinata                                    ↓
                ↑                              Uploaded to Kulfy
                └─────────────────────────────────────┘
```

Happy meme generating! 🍦

