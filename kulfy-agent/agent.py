"""
LangGraph Agent for Telugu Meme Generation

This agent:
1. Scrapes greatandhra.com for Telugu news/entertainment content
2. Analyzes content with GPT-4 to find meme-worthy topics
3. Generates 5 meme concepts with English text + Telugu context
4. Creates cartoon-style images using DALL-E 3
5. Uploads memes to Kulfy app via API
"""

import os
import json
import base64
import requests
from io import BytesIO
from typing import TypedDict, List, Dict, Any, Annotated, Optional
from bs4 import BeautifulSoup
from openai import OpenAI
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage
import aiohttp
import asyncio
from dotenv import load_dotenv
import logging

# Load environment variables from .env file
load_dotenv()

# Enable verbose logging for LangChain/LangGraph
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # Console output
        logging.FileHandler('langchain.log', mode='a')  # File output
    ]
)

# Create logger for this module (must be created before using it)
logger = logging.getLogger(__name__)

# Set LangChain to verbose mode (only if LANGCHAIN_API_KEY is set)
# LangSmith tracing is optional - only enable if API key is configured
if os.getenv('LANGCHAIN_API_KEY'):
    os.environ['LANGCHAIN_TRACING_V2'] = 'true'
    logger.info("LangSmith tracing enabled (LANGCHAIN_API_KEY found)")
else:
    os.environ['LANGCHAIN_TRACING_V2'] = 'false'
    logger.info("LangSmith tracing disabled (no LANGCHAIN_API_KEY)")

# Always enable verbose mode for local debugging
os.environ['LANGCHAIN_VERBOSE'] = 'true'

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
logger.info("="*60)
logger.info("🎭 KULFY MEME GENERATION AGENT - LANGCHAIN LOGGING ENABLED")
logger.info("="*60)


class AgentState(TypedDict):
    """State shared across all nodes in the agent graph"""
    input_urls: List[str]                    # User-provided URLs
    scraped_content: List[Dict[str, str]]    # Fetched article content
    meme_concepts: List[Dict[str, str]]      # Generated meme ideas
    generated_images: List[Dict[str, Any]]   # DALL-E generated images
    upload_results: List[Dict[str, Any]]     # Results from Kulfy upload
    errors: List[str]                        # Any errors encountered
    status: str                              # Current status
    status_callback: Any                     # Callback for status updates


# ============================================================================
# NODE 1: FETCH CONTENT FROM URLs
# ============================================================================

def fetch_content_from_urls(state: AgentState) -> AgentState:
    """
    Fetches content from user-provided URLs.
    Extracts article titles, text content, and metadata.
    """
    callback = state.get('status_callback')
    def log(msg, log_type='info', step=None):
        print(msg)
        if callback:
            callback(log_type, msg, step)
    
    log("📥 [FETCH] Fetching content from provided URLs...", 'info', 'Fetching URLs')
    
    urls = state.get('input_urls', [])
    
    if not urls:
        print("⚠️  [FETCH] No URLs provided, using fallback content...")
        state['scraped_content'] = [
            {
                'title': 'Latest Telugu movie creates box office record',
                'snippet': 'The new blockbuster crosses 100 crores in first week',
                'url': ''
            },
            {
                'title': 'Popular actor announces new project',
                'snippet': 'Fans excited about the upcoming film collaboration',
                'url': ''
            }
        ]
        state['status'] = 'scraped_fallback'
        return state
    
    articles = []
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
    
    for url in urls[:10]:  # Limit to 10 URLs
        try:
            log(f"   Fetching: {url[:60]}...")
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # DEBUG: Show raw HTML structure
            print(f"\n🔍 [DEBUG] Parsing URL: {url}")
            
            # Try to extract title - improved selectors
            title = None
            title_selectors = [
                'h1.article-title',
                'h1.entry-title', 
                'h1[itemprop="headline"]',
                'meta[property="og:title"]',
                'h1',
                'h2.title',
                '.article-title',
                '.post-title',
                'title'
            ]
            
            for selector in title_selectors:
                if selector.startswith('meta'):
                    element = soup.select_one(selector)
                    if element and element.get('content'):
                        title = element.get('content')
                        print(f"   ✅ Title found via {selector}: {title[:60]}...")
                        break
                else:
                    element = soup.select_one(selector)
                    if element:
                        title = element.get_text(strip=True)
                        if len(title) > 10 and not title.lower().startswith(('home', 'menu', 'skip')):
                            print(f"   ✅ Title found via {selector}: {title[:60]}...")
                            break
            
            # Try to extract main content - improved selectors
            content = ''
            content_selectors = [
                'div[itemprop="articleBody"]',
                'article.post-content',
                'div.article-content',
                '.entry-content',
                'article',
                '.post-content',
                'main article'
            ]
            
            for selector in content_selectors:
                elements = soup.select(selector)
                if elements:
                    # Get text from all paragraphs within the content
                    paragraphs = elements[0].find_all('p')
                    if paragraphs:
                        content = ' '.join([p.get_text(strip=True) for p in paragraphs[:10]])
                        if len(content) > 100:
                            print(f"   ✅ Content found via {selector}: {len(content)} chars")
                            break
            
            # Extract all paragraphs as fallback
            if len(content) < 100:
                paragraphs = soup.find_all('p')
                content = ' '.join([p.get_text(strip=True) for p in paragraphs[:10]])
                print(f"   ⚠️  Using fallback paragraph extraction: {len(content)} chars")
            
            if title or content:
                articles.append({
                    'title': title or 'Article from ' + url.split('/')[2],
                    'snippet': content[:500] if content else '',  # First 500 chars
                    'url': url
                })
                log(f"   ✅ Fetched: {title or 'Untitled'}", 'success')
            else:
                print(f"   ⚠️  No content found")
                
        except Exception as e:
            error_msg = f"Failed to fetch {url}: {str(e)}"
            print(f"   ❌ {error_msg}")
            state['errors'].append(error_msg)
    
    if len(articles) == 0:
        print("⚠️  [FETCH] No articles fetched, using fallback content...")
        state['scraped_content'] = [
            {
                'title': 'Latest Telugu movie creates box office record',
                'snippet': 'The new blockbuster crosses 100 crores in first week',
                'url': ''
            },
            {
                'title': 'Popular actor announces new project',
                'snippet': 'Fans excited about the upcoming film collaboration',
                'url': ''
            }
        ]
        state['status'] = 'scraped_fallback'
    else:
        log(f"✅ [FETCH] Successfully fetched {len(articles)} articles", 'success')
        state['scraped_content'] = articles
        state['status'] = 'scraped'
    
    return state


# ============================================================================
# NODE 2: ANALYZE & GENERATE MEME CONCEPTS
# ============================================================================

def generate_meme_concepts(state: AgentState) -> AgentState:
    """
    Uses GPT-4 to analyze scraped content and generate 5 meme concepts.
    Each concept has English text with Telugu cultural context.
    """
    callback = state.get('status_callback')
    def log(msg, log_type='info', step=None):
        print(msg)
        if callback:
            callback(log_type, msg, step)
    
    log("🧠 [ANALYZE] Generating meme concepts with GPT-4...", 'info', 'Analyzing content')
    
    # Verify OpenAI API key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise Exception("OPENAI_API_KEY environment variable is not set!")
    if not api_key.startswith("sk-"):
        raise Exception("OPENAI_API_KEY appears to be invalid (should start with 'sk-')")
    print(f"   ✅ OpenAI API Key configured: {api_key[:10]}...{api_key[-4:]}")
    
    try:
        # Prepare content summary
        log("   📝 Preparing content summary from fetched articles...")
        content_summary = "\n".join([
            f"- {article['title']}: {article['snippet'][:100]}"
            for article in state['scraped_content'][:10]
        ])
        log(f"   ✅ Content summary prepared ({len(state['scraped_content'])} articles)", 'success')
        
        # DEBUG: Show what content is being sent to GPT-4
        print("\n" + "="*60)
        print("🔍 [DEBUG] Content being sent to GPT-4:")
        print("="*60)
        for i, article in enumerate(state['scraped_content'][:10], 1):
            print(f"\n📄 Article {i}:")
            print(f"   Title: {article['title']}")
            print(f"   URL: {article.get('url', 'N/A')}")
            print(f"   Snippet length: {len(article['snippet'])} chars")
            print(f"   Snippet preview: {article['snippet'][:200]}...")
        print("="*60 + "\n")
        
        prompt = f"""Based on the following Telugu news/entertainment headlines, create 5 hilarious meme concepts.

HEADLINES:
{content_summary}

TARGET AUDIENCE:
- Telugu speakers aged 20-40 years
- Digital natives who consume Telugu cinema, OTT content, and social media
- Appreciate clever wordplay, cultural references, and relatable humor

CONTENT GUIDELINES:
- Use ENGLISH text with Telugu cultural context (no Romanized Telugu)
- Humor should be witty, observational, and relatable to 20-40 age group
- Reference modern Telugu cinema, OTT trends, tech, lifestyle
- Avoid outdated or elderly-focused humor
- Make it shareable and social media-friendly
- CRITICAL: Use CORRECT SPELLINGS in all English text (no typos!)
- Keep language clean and appropriate

MEME STYLE:
- Short, punchy text (max 15 words per text overlay)
- Exaggerated, cartoon-style visuals
- Relatable situations (work, relationships, movies, daily life)
- Native Telugu sensibility (not generic Indian content)

OUTPUT FORMAT (JSON):
[
  {{
    "title": "Catchy meme title/caption",
    "text_overlay": "Main text to appear on meme (English only, correct spelling, max 15 words)",
    "visual_description": "Detailed cartoon scene description for DALL-E (2-3 sentences, be specific)",
    "context": "Why this resonates with Telugu 20-40 audience (1 sentence)"
  }}
]

Generate exactly 5 meme concepts as a JSON array. Ensure ALL text has correct spelling and grammar."""

        # DEBUG: Show the full prompt being sent
        print("\n" + "="*60)
        print("🔍 [DEBUG] Full GPT-4 Prompt:")
        print("="*60)
        print(prompt)
        print("="*60 + "\n")

        log("   🤖 Calling GPT-4 API (this may take 30-60 seconds)...", 'info', 'GPT-4 analyzing')
        log("   ⏳ Please wait while AI analyzes content and generates meme concepts...")
        
        try:
            import time
            start_time = time.time()
            
            response = client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {
                        "role": "system", 
                        "content": """You are an expert Telugu meme creator specializing in content for young Telugu audiences (20-40 years old).

Your memes are:
- Witty and culturally relevant to modern Telugu youth
- Use correct English spelling and grammar (NO TYPOS)
- Reference Telugu cinema, OTT content, tech, and contemporary lifestyle
- Avoid outdated references or old-generation humor
- Shareable on social media platforms

Focus on native Telugu appeal - not generic Indian content. The humor should resonate specifically with Telugu-speaking millennials and Gen Z who are bilingual, tech-savvy, and consume both Telugu and English content."""
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,  # Balanced creativity with coherence
                response_format={"type": "json_object"},
                timeout=90.0  # 90 second timeout
            )
            
            elapsed_time = time.time() - start_time
            log(f"   ⏱️  GPT-4 API call took {elapsed_time:.1f} seconds", 'info')
            
        except Exception as api_error:
            error_msg = f"GPT-4 API call failed: {str(api_error)}"
            print(f"   ❌ {error_msg}")
            raise Exception(error_msg)
        
        log("   ✅ GPT-4 response received! Parsing meme concepts...", 'success')
        
        # Parse JSON response
        raw_response = response.choices[0].message.content
        log(f"   🔍 Raw GPT-4 response preview: {raw_response[:200]}...")
        
        memes_data = json.loads(raw_response)
        print(f"   🔍 Parsed JSON type: {type(memes_data)}")
        print(f"   🔍 JSON keys: {memes_data.keys() if isinstance(memes_data, dict) else 'N/A'}")
        
        # Handle different JSON structures
        meme_concepts = []
        if isinstance(memes_data, dict):
            # Try different possible keys
            for key in ['memes', 'concepts', 'meme_concepts', 'data', 'items']:
                if key in memes_data:
                    meme_concepts = memes_data[key]
                    print(f"   ✅ Found memes under key: '{key}'")
                    break
            
            # If no array found, check if the dict itself contains meme properties
            if not meme_concepts and all(k in memes_data for k in ['title', 'text_overlay']):
                # Single meme returned as dict instead of array
                meme_concepts = [memes_data]
                print(f"   ⚠️  Single meme detected, wrapping in array")
            
            # Last resort: look for any key with array value
            if not meme_concepts:
                for key, value in memes_data.items():
                    if isinstance(value, list) and len(value) > 0:
                        meme_concepts = value
                        print(f"   ⚠️  Found array under key: '{key}'")
                        break
        elif isinstance(memes_data, list):
            meme_concepts = memes_data
            print(f"   ✅ Response is already an array")
        
        # Validate we got memes
        if not meme_concepts:
            raise ValueError(f"No meme concepts found in GPT-4 response. Response keys: {memes_data.keys() if isinstance(memes_data, dict) else 'N/A'}")
        
        # Ensure we have exactly 5 concepts
        meme_concepts = meme_concepts[:5]
        
        log(f"✅ [ANALYZE] Generated {len(meme_concepts)} meme concepts", 'success')
        for i, meme in enumerate(meme_concepts, 1):
            log(f"   {i}. {meme.get('title', 'Untitled')}")
        
        state['meme_concepts'] = meme_concepts
        state['status'] = 'concepts_ready'
        
    except Exception as e:
        error_msg = f"Concept generation failed: {str(e)}"
        print(f"❌ [ANALYZE] {error_msg}")
        print(f"   💡 Using fallback meme concepts for testing...")
        state['errors'].append(error_msg)
        
        # Fallback: Generate sample meme concepts for testing
        state['meme_concepts'] = [
            {
                "title": "When they announce ticket prices for a Prabhas movie",
                "text_overlay": "My wallet: Kalyan Ram! My excitement: Bahubali!",
                "visual_description": "A cartoon person with an excited face on one side and crying wallet on the other, Telugu cinema posters in background",
                "context": "Telugu movie fans know the struggle of high ticket prices vs love for stars"
            },
            {
                "title": "Waiting for OTT release vs Theater experience",
                "text_overlay": "OTT watchers: Patient. Theater goers: First show first!",
                "visual_description": "Split cartoon scene - calm person waiting at home vs excited crowd rushing to theater",
                "context": "Telugu audience debates about watching movies in theater or waiting for streaming"
            },
            {
                "title": "When director says 'pan-India' film",
                "text_overlay": "Budget: Telugu. Dreams: Avengers level!",
                "visual_description": "Cartoon director pointing at tiny budget pile while imagining massive Hollywood-style explosions",
                "context": "Every Telugu film now aims for pan-India success like RRR and Pushpa"
            },
            {
                "title": "First day first show experience",
                "text_overlay": "Expectations: Bahubali. Reality: Ticket tatkal!",
                "visual_description": "Cartoon showing excited fan rushing with tickets vs struggling with BookMyShow app crashing",
                "context": "Getting first day tickets is a mission for Telugu cinema fans"
            },
            {
                "title": "When interval bang hits different",
                "text_overlay": "My brain: Logic? My heart: Whistles and claps!",
                "visual_description": "Cartoon audience member with confused brain but dancing body during movie interval scene",
                "context": "Telugu movies are famous for their high-energy interval sequences"
            }
        ]
        state['status'] = 'concepts_ready'
        print(f"✅ [ANALYZE] Using {len(state['meme_concepts'])} fallback meme concepts")
    
    return state


# ============================================================================
# NODE 3: GENERATE IMAGES WITH DALL-E 3
# ============================================================================

def generate_images(state: AgentState, custom_prompts: Optional[List[Dict[str, str]]] = None) -> AgentState:
    """
    Creates cartoon-style meme images using DALL-E 3.
    Generates one image per meme concept.
    Saves to local disk and uploads immediately after each generation.
    
    Args:
        state: Agent state with meme concepts
        custom_prompts: Optional list of custom prompts to override concepts.
                        Each dict should have 'visual_description' and 'text_overlay'
    """
    callback = state.get('status_callback')
    def log(msg, log_type='info', step=None):
        print(msg)
        if callback:
            callback(log_type, msg, step)
    
    log("\n🎨 [DALLE] Generating cartoon images...", 'info', 'Generating images')
    
    # Use custom prompts if provided, otherwise use concepts from state
    concepts_to_use = custom_prompts if custom_prompts else state['meme_concepts']
    log(f"   🎯 Will create {len(concepts_to_use)} memes")
    if custom_prompts:
        log("   ✏️  Using custom/edited prompts from user", 'info')
    
<<<<<<< Updated upstream
=======
    # Create temporary directory for memes (in project folder)
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    local_meme_dir = os.path.join(script_dir, "temp_memes")
    os.makedirs(local_meme_dir, exist_ok=True)
    log(f"   📁 Temporary storage: {local_meme_dir}")
    
>>>>>>> Stashed changes
    generated_images = []
    upload_url = os.getenv("KULFY_UPLOAD_URL", "http://localhost:3000/api/upload")
    upload_results = []
    
    for i, concept in enumerate(concepts_to_use, 1):
        try:
            title = concept.get('title', f'Meme {i}')
            text_overlay = concept.get('text_overlay', '')
            visual_desc = concept.get('visual_description', concept.get('title', ''))
            
            log(f"\n   🖼️  Generating image {i}/{len(concepts_to_use)}: {title}", 'info', f'Generating image {i}/{len(concepts_to_use)}')
            log(f"   📝 Text overlay: {text_overlay[:60]}...")
            log(f"   🎨 Visual description: {visual_desc[:80]}...")
            
            # Craft DALL-E prompt
            dalle_prompt = f"""Create a cartoon-style meme image:

SCENE: {visual_desc}

TEXT OVERLAY: "{text_overlay}"

STYLE:
- Cartoon/comic art style
- Bold, expressive characters
- Telugu cinema/culture aesthetic
- Bright colors
- Suitable for social media meme format
- Text should be clearly readable

Make it funny and exaggerated!"""

            log(f"   🎨 Calling DALL-E 3 API (this may take 20-40 seconds)...")
            
            # Generate image with DALL-E 3
            response = client.images.generate(
                model="dall-e-3",
                prompt=dalle_prompt,
                size="1024x1024",  # Square format
                quality="standard",  # "hd" is more expensive
                n=1,
            )
            
            image_url = response.data[0].url
            log(f"   ✅ DALL-E 3 image generated!", 'success')
            
            # Download image
            log(f"   📥 Downloading image from OpenAI...")
            img_response = requests.get(image_url, timeout=30)
            img_response.raise_for_status()
            image_data = img_response.content
            log(f"   ✅ Image downloaded ({len(image_data) // 1024} KB)", 'success')
            
            generated_images.append({
                'concept': concept,
                'image_url': image_url,
                'image_data': image_data,
                'mime': 'image/png',
                'title': concept.get('title', f'Telugu Meme {i}'),
                'source_url': state['scraped_content'][0]['url'] if state.get('scraped_content') and len(state['scraped_content']) > 0 else None,
            })
            
            # Upload immediately to Kulfy
            log(f"   ⬆️  Uploading to Kulfy app...", 'info', f'Uploading image {i}/5')
            try:
                files = {
                    'file': ('meme.png', BytesIO(image_data), 'image/png')
                }
                
                # Include source URL if available
                source_url = None
                if state.get('scraped_content') and len(state['scraped_content']) > 0:
                    source_url = state['scraped_content'][0].get('url')
                
                data = {
                    'title': f"🤖 {concept.get('title', f'Telugu Meme {i}')} [AI-Generated]",
                }
                
                if source_url:
                    data['sourceUrl'] = source_url
                
                upload_response = requests.post(
                    upload_url,
                    files=files,
                    data=data,
                    timeout=30
                )
                
                if upload_response.status_code == 200:
                    result = upload_response.json()
                    upload_results.append({
                        'success': True,
                        'title': concept.get('title', f'Telugu Meme {i}'),
                        'cid': result.get('cid'),
                        'id': result.get('id'),
                    })
                    log(f"   ✅ Upload successful!", 'success')
                    log(f"   🔗 CID: {result.get('cid', 'N/A')[:20]}...")
                    log(f"   🆔 Post ID: {result.get('id', 'N/A')}")
                    
                    # Delete local file after successful upload
                    try:
                        os.remove(filepath)
                        log(f"   🗑️  Deleted local file: {filename}")
                    except Exception as delete_error:
                        log(f"   ⚠️  Could not delete file: {delete_error}")
                else:
                    error_msg = f"Upload failed with status {upload_response.status_code}"
                    print(f"   ❌ {error_msg}")
                    upload_results.append({
                        'success': False,
                        'title': concept.get('title', f'Telugu Meme {i}'),
                        'error': error_msg,
                    })
                    state['errors'].append(error_msg)
                    
            except Exception as upload_error:
                error_msg = f"Upload failed: {str(upload_error)}"
                print(f"   ❌ {error_msg}")
                upload_results.append({
                    'success': False,
                    'title': concept.get('title', f'Telugu Meme {i}'),
                    'error': error_msg,
                })
                state['errors'].append(error_msg)
            
        except Exception as e:
            error_msg = f"Image {i} generation failed: {str(e)}"
            print(f"   ❌ {error_msg}")
            state['errors'].append(error_msg)
            
            # Try to delete the file even if upload failed
            try:
                if 'filepath' in locals() and os.path.exists(filepath):
                    os.remove(filepath)
                    log(f"   🗑️  Deleted failed file: {os.path.basename(filepath)}")
            except:
                pass
    
    state['generated_images'] = generated_images
    state['upload_results'] = upload_results  # Store upload results here
    state['status'] = 'images_ready'
    
    successful_uploads = sum(1 for r in upload_results if r.get('success'))
    print(f"✅ [DALLE] Generated {len(generated_images)}/5 images")
    print(f"✅ [UPLOAD] Uploaded {successful_uploads}/{len(generated_images)} memes")
    
    # Clean up temp directory if empty
    try:
        if os.path.exists(local_meme_dir) and not os.listdir(local_meme_dir):
            os.rmdir(local_meme_dir)
            log(f"   🗑️  Cleaned up empty temp directory")
    except Exception as cleanup_error:
        log(f"   ⚠️  Could not clean up temp directory: {cleanup_error}")
    
    return state


# ============================================================================
# NODE 4: UPLOAD TO KULFY APP
# ============================================================================

def upload_to_kulfy(state: AgentState) -> AgentState:
    """
    This step is now integrated into generate_images().
    This function just marks the process as completed.
    """
    print("✅ [COMPLETE] All memes generated and uploaded!")
    
    # Upload results are already stored in state from generate_images
    state['status'] = 'completed'
    
    # Print summary
    if state.get('upload_results'):
        successful_uploads = sum(1 for r in state['upload_results'] if r.get('success'))
        print(f"📊 Final Summary: {successful_uploads}/{len(state['upload_results'])} memes uploaded successfully")
    
    return state


# ============================================================================
# BUILD THE LANGGRAPH WORKFLOW
# ============================================================================

def create_meme_agent():
    """
    Creates the LangGraph agent workflow.
    """
    # Define the graph
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("fetch", fetch_content_from_urls)
    workflow.add_node("analyze", generate_meme_concepts)
    workflow.add_node("generate_images", generate_images)
    workflow.add_node("upload", upload_to_kulfy)
    
    # Define edges (flow)
    workflow.set_entry_point("fetch")
    workflow.add_edge("fetch", "analyze")
    workflow.add_edge("analyze", "generate_images")
    workflow.add_edge("generate_images", "upload")
    workflow.add_edge("upload", END)
    
    # Compile the graph
    app = workflow.compile()
    
    return app


def create_concepts_only_agent():
    """
    Creates a LangGraph agent that stops after generating concepts.
    Used for two-phase generation where user reviews prompts first.
    """
    workflow = StateGraph(AgentState)
    
    workflow.add_node("fetch", fetch_content_from_urls)
    workflow.add_node("analyze", generate_meme_concepts)
    
    workflow.set_entry_point("fetch")
    workflow.add_edge("fetch", "analyze")
    workflow.add_edge("analyze", END)
    
    return workflow.compile()


# ============================================================================
# MAIN EXECUTION FUNCTION
# ============================================================================

async def run_meme_generation_concepts_only(urls: Optional[List[str]] = None, status_callback=None):
    """
    Runs only the concept generation phase (fetch + analyze).
    Stops before image generation so user can review prompts.
    
    Args:
        urls: Optional list of URLs to fetch content from
        status_callback: Optional callback function to send status updates
        
    Returns concepts with DALL-E prompts ready for review.
    """
    def log(message, log_type='info', step=None):
        """Helper to log and send to callback"""
        print(message)
        logger.info(f"[{log_type.upper()}] {message}")
        if status_callback:
            status_callback(log_type, message, step)
    
    log("\n" + "="*60)
    log("🎭 KULFY MEME GENERATION - CONCEPTS PHASE")
    log("="*60 + "\n")
    
    if urls:
        log(f"📰 Using {len(urls)} provided URLs", 'info', 'Fetching content')
    else:
        log("📰 No URLs provided, using fallback content", 'info')
    
    initial_state = {
        'input_urls': urls or [],
        'scraped_content': [],
        'meme_concepts': [],
        'generated_images': [],
        'upload_results': [],
        'errors': [],
        'status': 'starting',
        'status_callback': status_callback
    }
    
    log("🔧 Creating concepts-only agent workflow...", 'info', 'Initializing agent')
    agent = create_concepts_only_agent()
    log("✅ Agent workflow created", 'success')
    
    log("🚀 Running fetch + analyze phases...", 'info', 'Generating concepts')
    final_state = agent.invoke(initial_state)
    
    log("✅ Concept generation completed", 'success')
    
    # Format prompts for DALL-E
    dalle_prompts = []
    for concept in final_state.get('meme_concepts', []):
        visual_desc = concept.get('visual_description', '')
        text_overlay = concept.get('text_overlay', '')
        
        dalle_prompt = f"""Create a cartoon-style meme image:

SCENE: {visual_desc}

TEXT OVERLAY: "{text_overlay}"

STYLE:
- Cartoon/comic art style
- Bold, expressive characters
- Telugu cinema/culture aesthetic
- Bright colors
- Suitable for social media meme format
- Text should be clearly readable

Make it funny and exaggerated!"""
        
        dalle_prompts.append({
            'title': concept.get('title', 'Untitled'),
            'text_overlay': text_overlay,
            'visual_description': visual_desc,
            'context': concept.get('context', ''),
            'dalle_prompt': dalle_prompt,
        })
    
    return {
        'status': 'concepts_ready',
        'concepts': final_state.get('meme_concepts', []),
        'dalle_prompts': dalle_prompts,
        'articles_scraped': len(final_state.get('scraped_content', [])),
    }


async def run_meme_generation(urls: Optional[List[str]] = None, status_callback=None, custom_prompts: Optional[List[Dict[str, str]]] = None):
    """
    Runs the entire meme generation pipeline.
    
    Args:
        urls: Optional list of URLs to fetch content from
        status_callback: Optional callback function to send status updates
        
    Returns summary of results.
    """
    def log(message, log_type='info', step=None):
        """Helper to log and send to callback"""
        print(message)
        logger.info(f"[{log_type.upper()}] {message}")
        if status_callback:
            status_callback(log_type, message, step)
    
    log("\n" + "="*60)
    log("🎭 KULFY MEME GENERATION AGENT - LANGCHAIN EXECUTION")
    log("="*60 + "\n")
    
    if urls:
        log(f"📰 Using {len(urls)} provided URLs", 'info', 'Fetching content')
    else:
        log("📰 No URLs provided, using fallback content", 'info')
    
    # If custom prompts provided, skip concept generation and go straight to images
    if custom_prompts:
        log("\n" + "="*60, 'info')
        log("✏️  DIRECT PROMPT MODE: Bypassing fetch & analyze", 'info', 'Using custom prompts')
        log("="*60, 'info')
        log(f"📝 Received {len(custom_prompts)} custom prompt(s) from kulfy-chat", 'info')
        
        # DEBUG: Show custom prompts being used
        print("\n🔍 [DEBUG] Custom Prompts Received from Kulfy Chat:")
        print("="*60)
        for i, prompt in enumerate(custom_prompts, 1):
            print(f"\n📝 Prompt {i}:")
            print(f"   Title: {prompt.get('title', 'N/A')}")
            print(f"   Text Overlay: {prompt.get('text_overlay', 'N/A')[:80]}...")
            print(f"   Visual Desc: {prompt.get('visual_description', 'N/A')[:80]}...")
        print("="*60 + "\n")
        
        log("🎨 Creating simplified workflow: GENERATE_IMAGES only", 'info')
        
        initial_state = {
            'input_urls': urls or [],
            'scraped_content': [{'title': 'Custom', 'snippet': 'User-provided prompts', 'url': ''}],
            'meme_concepts': custom_prompts,  # Use custom prompts as concepts
            'generated_images': [],
            'upload_results': [],
            'errors': [],
            'status': 'concepts_ready',
            'status_callback': status_callback
        }
        
        # Create a simplified workflow that just generates images
        workflow = StateGraph(AgentState)
        workflow.add_node("generate_images", lambda s: generate_images(s, custom_prompts))
        workflow.set_entry_point("generate_images")
        workflow.add_edge("generate_images", END)
        agent = workflow.compile()
        log("✅ Simplified workflow created - going straight to DALL-E 3", 'success')
    else:
        # Normal flow: fetch -> analyze -> generate -> upload
        initial_state = {
            'input_urls': urls or [],
            'scraped_content': [],
            'meme_concepts': [],
            'generated_images': [],
            'upload_results': [],
            'errors': [],
            'status': 'starting',
            'status_callback': status_callback
        }
        
        log("🔧 Creating LangGraph agent workflow...", 'info', 'Initializing agent')
        agent = create_meme_agent()
        log("✅ Agent workflow created", 'success')
    
    log("🚀 Invoking LangGraph agent (this will show detailed LangChain execution)...", 'info', 'Running agent')
    logger.info("="*60)
    logger.info("LANGGRAPH AGENT INVOCATION START")
    logger.info("="*60)
    
    final_state = agent.invoke(initial_state)
    
    logger.info("="*60)
    logger.info("LANGGRAPH AGENT INVOCATION COMPLETE")
    logger.info("="*60)
    log("✅ LangGraph agent execution completed", 'success')
    
    # Prepare summary
    summary = {
        'status': final_state['status'],
        'articles_scraped': len(final_state['scraped_content']),
        'concepts_generated': len(final_state['meme_concepts']),
        'images_created': len(final_state['generated_images']),
        'successful_uploads': sum(1 for r in final_state['upload_results'] if r.get('success')),
        'failed_uploads': sum(1 for r in final_state['upload_results'] if not r.get('success')),
        'errors': final_state['errors'],
        'upload_results': final_state['upload_results'],
    }
    
    print("\n" + "="*60)
    print("📊 GENERATION SUMMARY")
    print("="*60)
    print(f"Status: {summary['status']}")
    print(f"Articles Scraped: {summary['articles_scraped']}")
    print(f"Concepts Generated: {summary['concepts_generated']}")
    print(f"Images Created: {summary['images_created']}")
    print(f"Successful Uploads: {summary['successful_uploads']}")
    print(f"Failed Uploads: {summary['failed_uploads']}")
    if summary['errors']:
        print(f"\n⚠️  Errors: {len(summary['errors'])}")
        for error in summary['errors']:
            print(f"   - {error}")
    print("="*60 + "\n")
    
    return summary


if __name__ == "__main__":
    # For testing the agent directly
    import asyncio
    asyncio.run(run_meme_generation())

