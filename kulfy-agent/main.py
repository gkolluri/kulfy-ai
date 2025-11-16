"""
FastAPI Service for Kulfy Meme Generation Agent

This service provides an API endpoint to trigger the LangGraph agent
that scrapes news, generates meme concepts, creates images, and uploads to Kulfy.

Usage:
    uvicorn main:app --reload --port 8000

Endpoints:
    POST /generate-memes - Trigger meme generation
    GET /health - Health check
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv
import asyncio
from datetime import datetime

from agent import run_meme_generation

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Kulfy Meme Generation Agent",
    description="AI-powered Telugu meme generator using LangGraph + DALL-E 3",
    version="1.0.0"
)

# CORS middleware (allow Next.js app to call this service)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://kulfy-ai.vercel.app",
        "*",  # For development - restrict in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for generation status (use Redis in production)
generation_status = {
    'is_running': False,
    'last_run': None,
    'last_result': None,
    'logs': [],  # Real-time logs from agent
    'current_step': '',  # Current step description
}


def update_generation_status(log_type: str, message: str, step: str = None):
    """Callback to update generation status with logs"""
    generation_status['logs'].append({'type': log_type, 'message': message})
    if step:
        generation_status['current_step'] = step
    print(message)  # Also print to terminal


# ============================================================================
# MODELS
# ============================================================================

class GenerateMemesRequest(BaseModel):
    """Request model for meme generation"""
    count: Optional[int] = 5  # Number of memes to generate
    urls: Optional[List[str]] = None  # URLs to fetch content from
    webhook_url: Optional[str] = None  # Optional webhook to notify on completion


class GenerateMemesResponse(BaseModel):
    """Response model for meme generation"""
    success: bool
    message: str
    job_id: Optional[str] = None
    status: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    openai_configured: bool
    kulfy_endpoint: str


# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint with API info"""
    return {
        "service": "Kulfy Meme Generation Agent",
        "version": "1.0.0",
        "endpoints": {
            "generate": "POST /generate-memes",
            "health": "GET /health",
            "status": "GET /status",
        }
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        openai_configured=bool(os.getenv("OPENAI_API_KEY")),
        kulfy_endpoint=os.getenv("KULFY_UPLOAD_URL", "not_configured"),
    )


@app.get("/status")
async def get_status():
    """Get current generation status with real-time logs"""
    return {
        "is_running": generation_status['is_running'],
        "last_run": generation_status['last_run'],
        "last_result": generation_status['last_result'],
        "logs": generation_status.get('logs', []),
        "current_step": generation_status.get('current_step', ''),
    }


@app.post("/generate-memes", response_model=GenerateMemesResponse)
async def generate_memes(
    request: GenerateMemesRequest,
    background_tasks: BackgroundTasks
):
    """
    Trigger meme generation process.
    
    This endpoint starts the agent workflow that:
    1. Fetches content from URLs
    2. Analyzes content with GPT-4
    3. Generates meme concepts
    4. Creates images with DALL-E 3
    5. Uploads to Kulfy app
    
    The process runs in the background and typically takes 2-5 minutes.
    """
    # Check if already running
    if generation_status['is_running']:
        return GenerateMemesResponse(
            success=False,
            message="Meme generation already in progress. Please wait.",
            status="busy",
        )
    
    # Validate OpenAI key
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail="OpenAI API key not configured"
        )
    
    # Mark as running and reset logs
    generation_status['is_running'] = True
    generation_status['last_run'] = datetime.now().isoformat()
    generation_status['logs'] = []
    generation_status['current_step'] = 'Starting...'
    
    # Run agent in background
    background_tasks.add_task(run_generation_task, request)
    
    return GenerateMemesResponse(
        success=True,
        message="Meme generation started! This will take 2-5 minutes.",
        job_id=generation_status['last_run'],
        status="running",
    )


async def run_generation_task(request: GenerateMemesRequest):
    """
    Background task that runs the meme generation agent.
    """
    try:
        log_message = f"🚀 Starting meme generation at {datetime.now().strftime('%H:%M:%S')}"
        print(f"\n{log_message}")
        generation_status['logs'].append({'type': 'info', 'message': log_message})
        
        if request.urls and len(request.urls) > 0:
            log_message = f"📰 Using {len(request.urls)} provided URL(s)"
            print(log_message)
            generation_status['logs'].append({'type': 'info', 'message': log_message})
            for url in request.urls:
                generation_status['logs'].append({'type': 'info', 'message': f"  • {url}"})
        
        generation_status['current_step'] = 'Fetching content...'
        
        # Run the agent with status callback
        result = await run_meme_generation(urls=request.urls, status_callback=update_generation_status)
        
        # Store result
        generation_status['last_result'] = {
            'success': True,
            'completed_at': datetime.now().isoformat(),
            'summary': result,
        }
        
        log_message = "✅ Meme generation completed successfully!"
        print(f"\n{log_message}")
        generation_status['logs'].append({'type': 'success', 'message': log_message})
        generation_status['current_step'] = 'Completed!'
        
        # TODO: Send webhook notification if provided
        if request.webhook_url:
            pass  # Implement webhook notification
        
    except Exception as e:
        error_message = f"❌ Meme generation failed: {str(e)}"
        print(f"\n{error_message}")
        generation_status['logs'].append({'type': 'error', 'message': error_message})
        generation_status['last_result'] = {
            'success': False,
            'completed_at': datetime.now().isoformat(),
            'error': str(e),
        }
        generation_status['current_step'] = 'Failed'
    
    finally:
        generation_status['is_running'] = False


# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"""
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║   🎭 KULFY MEME GENERATION AGENT - FASTAPI SERVICE          ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    
    Server: http://{host}:{port}
    Docs: http://{host}:{port}/docs
    Health: http://{host}:{port}/health
    
    Ready to generate Telugu memes! 🚀
    """)
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )
