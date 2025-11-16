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

# Load environment variables from .env file
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


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
            
            # Try to extract title
            title = None
            for selector in ['h1', 'h2', '.article-title', '.post-title', 'title']:
                element = soup.select_one(selector)
                if element:
                    title = element.get_text(strip=True)
                    if len(title) > 10:
                        break
            
            # Try to extract main content
            content = ''
            for selector in ['article', '.article-content', '.post-content', '.entry-content', 'main', 'p']:
                elements = soup.select(selector)
                if elements:
                    content = ' '.join([el.get_text(strip=True) for el in elements[:5]])
                    if len(content) > 100:
                        break
            
            # Extract all paragraphs as fallback
            if len(content) < 100:
                paragraphs = soup.find_all('p')
                content = ' '.join([p.get_text(strip=True) for p in paragraphs[:10]])
            
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
    
    try:
        # Prepare content summary
        log("   📝 Preparing content summary from fetched articles...")
        content_summary = "\n".join([
            f"- {article['title']}: {article['snippet'][:100]}"
            for article in state['scraped_content'][:10]
        ])
        log(f"   ✅ Content summary prepared ({len(state['scraped_content'])} articles)", 'success')
        
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

        log("   🤖 Calling GPT-4 API (this may take 30-60 seconds)...", 'info', 'GPT-4 analyzing')
        log("   ⏳ Please wait while AI analyzes content and generates meme concepts...")
        
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
            response_format={"type": "json_object"}
        )
        
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

def generate_images(state: AgentState) -> AgentState:
    """
    Creates cartoon-style meme images using DALL-E 3.
    Generates one image per meme concept.
    Saves to local disk and uploads immediately after each generation.
    """
    callback = state.get('status_callback')
    def log(msg, log_type='info', step=None):
        print(msg)
        if callback:
            callback(log_type, msg, step)
    
    log("\n🎨 [DALLE] Generating cartoon images...", 'info', 'Generating images')
    log(f"   🎯 Will create {len(state['meme_concepts'])} memes")
    
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
    
    for i, concept in enumerate(state['meme_concepts'], 1):
        try:
            log(f"\n   🖼️  Generating image {i}/{len(state['meme_concepts'])}: {concept.get('title', 'Untitled')}", 'info', f'Generating image {i}/5')
            log(f"   📝 Text overlay: {concept.get('text_overlay', 'N/A')[:60]}...")
            
            # Craft DALL-E prompt
            dalle_prompt = f"""Create a cartoon-style meme image:

SCENE: {concept.get('visual_description', concept.get('title', ''))}

TEXT OVERLAY: "{concept.get('text_overlay', '')}"

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


# ============================================================================
# MAIN EXECUTION FUNCTION
# ============================================================================

async def run_meme_generation(urls: Optional[List[str]] = None, status_callback=None):
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
        if status_callback:
            status_callback(log_type, message, step)
    
    log("\n" + "="*60)
    log("🎭 KULFY MEME GENERATION AGENT")
    log("="*60 + "\n")
    
    if urls:
        log(f"📰 Using {len(urls)} provided URLs", 'info', 'Fetching content')
    else:
        log("📰 No URLs provided, using fallback content", 'info')
    
    # Initialize state
    initial_state = {
        'input_urls': urls or [],
        'scraped_content': [],
        'meme_concepts': [],
        'generated_images': [],
        'upload_results': [],
        'errors': [],
        'status': 'starting',
        'status_callback': status_callback  # Pass callback to nodes
    }
    
    # Create and run agent
    agent = create_meme_agent()
    final_state = agent.invoke(initial_state)
    
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

