# 🎭 Kulfy Meme Generation Agent

AI-powered Telugu meme generator using **LangGraph**, **GPT-4**, and **DALL-E 3**.

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Next.js App   │─────▶│  FastAPI Agent   │─────▶│   Kulfy API     │
│  /api/agent/    │      │  (LangGraph)     │      │  /api/upload    │
│  generate-memes │      │                  │      │                 │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                  │
                                  │
                         ┌────────▼────────┐
                         │   OpenAI APIs   │
                         │  - GPT-4        │
                         │  - DALL-E 3     │
                         └─────────────────┘
```

## 🔄 Agent Workflow

The LangGraph agent follows this pipeline:

```
1. SCRAPE        → Scrapes greatandhra.com for Telugu news/entertainment
2. ANALYZE       → Uses GPT-4 to generate 5 meme concepts
3. GENERATE      → Creates cartoon images with DALL-E 3
4. UPLOAD        → Uploads to Kulfy app (status: PENDING)
```

## 📦 Installation

### Prerequisites

- Python 3.9+
- pip or conda
- OpenAI API key
- Running Kulfy Next.js app (for upload endpoint)

### Setup

1. **Navigate to agent directory:**

```bash
cd kulfy-agent
```

2. **Create virtual environment:**

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**

```bash
pip install -r requirements.txt
```

4. **Configure environment variables:**

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```env
OPENAI_API_KEY=sk-...your-key...
KULFY_UPLOAD_URL=http://localhost:3000/api/upload
PORT=8000
HOST=0.0.0.0
```

## 🚀 Usage

### Start FastAPI Service

```bash
cd kulfy-agent
uvicorn main:app --reload --port 8000
```

Server will start at: `http://localhost:8000`

Interactive docs: `http://localhost:8000/docs`

### Test the Agent

#### Option 1: Via API (Recommended)

```bash
# Trigger meme generation
curl -X POST http://localhost:8000/generate-memes \
  -H "Content-Type: application/json" \
  -d '{"count": 5}'

# Check status
curl http://localhost:8000/status

# Health check
curl http://localhost:8000/health
```

#### Option 2: Run Agent Directly

```bash
cd kulfy-agent
python agent.py
```

#### Option 3: Via Next.js API

Make sure both services are running:
- Next.js: `http://localhost:3000`
- Kulfy Agent: `http://localhost:8000`

Then call from your app or terminal:

```bash
curl -X POST http://localhost:3000/api/agent/generate-memes \
  -H "Content-Type: application/json" \
  -d '{"count": 5}'
```

## 📊 Expected Output

```
🕷️  [SCRAPE] Starting web scraping...
✅ [SCRAPE] Found 15 articles

🧠 [ANALYZE] Generating meme concepts with GPT-4...
✅ [ANALYZE] Generated 5 meme concepts
   1. When ticket prices increase again
   2. Waiting for OTT release like
   3. Director's vision vs Final cut
   4. First day first show expectations
   5. Interval bang reactions

🎨 [DALLE] Generating cartoon images...
   Generating image 1/5: When ticket prices increase again
   ✅ Image 1 generated successfully
   [... continues for all 5 images ...]
✅ [DALLE] Generated 5/5 images

⬆️  [UPLOAD] Uploading memes to Kulfy...
   Uploading meme 1/5: When ticket prices increase again
   ✅ Uploaded successfully (CID: bafybei...)
   [... continues for all 5 memes ...]
✅ [UPLOAD] Uploaded 5/5 memes

📊 GENERATION SUMMARY
Status: completed
Articles Scraped: 15
Concepts Generated: 5
Images Created: 5
Successful Uploads: 5
Failed Uploads: 0
```

## 💰 Cost Estimate

- **GPT-4 Turbo**: ~$0.01-0.03 per generation (analyzing content + creating concepts)
- **DALL-E 3**: ~$0.04 per image (1024x1024 standard quality)
- **Total per run**: ~$0.25 for 5 memes

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | **Required** |
| `KULFY_UPLOAD_URL` | Kulfy upload endpoint | `http://localhost:3000/api/upload` |
| `PORT` | FastAPI server port | `8000` |
| `HOST` | FastAPI server host | `0.0.0.0` |

### Customize Meme Generation

Edit `agent.py` to customize:

- **Scraping targets**: Modify `scrape_news()` to target different sections
- **Meme style**: Adjust GPT-4 prompt in `generate_meme_concepts()`
- **Image style**: Modify DALL-E prompt in `generate_images()`
- **Image size**: Change from `1024x1024` to `1792x1024` (landscape) or `1024x1792` (portrait)

## 📝 API Reference

### POST /generate-memes

Triggers meme generation process.

**Request:**
```json
{
  "count": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Meme generation started! This will take 2-5 minutes.",
  "job_id": "2024-01-15T10:30:00.000Z",
  "status": "running"
}
```

### GET /status

Get current generation status.

**Response:**
```json
{
  "is_running": false,
  "last_run": "2024-01-15T10:30:00.000Z",
  "last_result": {
    "success": true,
    "completed_at": "2024-01-15T10:33:45.000Z",
    "summary": {
      "articles_scraped": 15,
      "concepts_generated": 5,
      "images_created": 5,
      "successful_uploads": 5
    }
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "openai_configured": true,
  "kulfy_endpoint": "http://localhost:3000/api/upload"
}
```

## 🐛 Troubleshooting

### "Agent service unavailable" Error

**Problem**: Next.js can't reach Kulfy agent service.

**Solution**:
```bash
# Make sure Kulfy agent service is running
cd kulfy-agent
uvicorn main:app --reload --port 8000
```

### "OpenAI API key not configured"

**Problem**: Missing or invalid OpenAI key.

**Solution**:
```bash
# Check .env file
cat kulfy-agent/.env

# Should have:
OPENAI_API_KEY=sk-...
```

### Web Scraping Fails

**Problem**: greatandhra.com structure changed or blocked.

**Solution**:
- Agent falls back to sample content automatically
- Update CSS selectors in `scrape_news()` function
- Add User-Agent headers to avoid blocks

### Images Not Uploading

**Problem**: Kulfy API unreachable.

**Solution**:
```bash
# Check Next.js app is running
curl http://localhost:3000/api/upload

# Update KULFY_UPLOAD_URL in .env
KULFY_UPLOAD_URL=http://localhost:3000/api/upload
```

## 🚀 Deployment

### Deploy FastAPI Service

**Option 1: Railway** (Recommended)
1. Push code to GitHub
2. Create Railway project
3. Add environment variables
4. Deploy from repo

**Option 2: Render**
1. Create Web Service
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Option 3: Docker**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Update Next.js Environment

Add to `.env.local`:
```env
KULFY_AGENT_URL=https://your-agent-service.railway.app
```

Redeploy to Vercel.

## 📚 Tech Stack

- **LangGraph**: Agent orchestration
- **FastAPI**: Python web framework
- **OpenAI GPT-4**: Content analysis & meme concepts
- **DALL-E 3**: Image generation
- **BeautifulSoup4**: Web scraping
- **Requests**: HTTP client

## 🎯 Next Steps

- [ ] Add scheduling (cron job for daily meme generation)
- [ ] Implement webhook notifications
- [ ] Add meme quality scoring
- [ ] Store generation history in database
- [ ] Add admin UI for agent control
- [ ] Support multiple news sources
- [ ] Fine-tune GPT-4 for better Telugu context
- [ ] Add meme template library

## 📄 License

Same as main Kulfy project (see root LICENSE file)

## 🙋 Support

For issues related to:
- **Agent logic**: Check `agent.py`
- **API service**: Check `main.py`
- **OpenAI errors**: Check API key and quotas
- **Upload errors**: Check Next.js `/api/upload` endpoint

---

Built with ❤️ for the Telugu meme community! 🎭

