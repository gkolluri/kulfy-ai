import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";

const KULFY_AGENT_URL = process.env.KULFY_AGENT_URL || 'http://localhost:8001';
// For production, try to detect the main app URL
// Priority: 1) NEXT_PUBLIC_KULFY_APP_URL env var, 2) Try to infer from VERCEL_URL, 3) Default to localhost
let KULFY_APP_URL = process.env.NEXT_PUBLIC_KULFY_APP_URL;
if (!KULFY_APP_URL) {
  // Try to infer from Vercel URL (e.g., kulfy-chat.vercel.app -> kulfy-ai.vercel.app)
  if (process.env.VERCEL_URL) {
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl.includes('kulfy-chat')) {
      KULFY_APP_URL = `https://${vercelUrl.replace('kulfy-chat', 'kulfy-ai')}`;
    } else {
      // Fallback: try common production URLs
      KULFY_APP_URL = 'https://kulfy-ai.vercel.app';
    }
  } else {
    KULFY_APP_URL = 'http://localhost:3000';
  }
}

// Log environment on module load (for debugging)
if (typeof console !== 'undefined') {
  console.log('[CHAT API] 🔧 Environment:', {
    KULFY_AGENT_URL,
    KULFY_APP_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    NEXT_PUBLIC_KULFY_APP_URL: process.env.NEXT_PUBLIC_KULFY_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
  });
}

// Helper function to extract URLs from text
function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

interface UploadResult {
  success: boolean;
  cid?: string;
  title?: string;
  id?: string;
}

interface ConceptData {
  dalle_prompts?: Array<{
    title: string;
    text_overlay: string;
    visual_description: string;
    context: string;
    dalle_prompt: string;
  }>;
}

interface AgentStatus {
  is_running?: boolean;
  status?: string;
  last_result?: {
    success?: boolean;
    completed_at?: string;
    concepts?: ConceptData;
    summary?: {
      upload_results?: UploadResult[];
      status?: string;
    };
    upload_results?: UploadResult[];
  };
  last_run?: string;
  logs?: Array<{ type: string; message: string; timestamp: string }>;
  current_step?: string;
}

// Helper function to poll for meme generation status
async function pollMemeGenerationStatus(maxAttempts = 60): Promise<{
  success: boolean;
  images?: Array<{ cid: string; title?: string; id?: string }>;
  error?: string;
}> {
  console.log('[POLL] 🔄 Starting polling (max attempts:', maxAttempts, ')');
  for (let i = 0; i < maxAttempts; i++) {
    try {
      if (i % 10 === 0) {
        console.log('[POLL] ⏱️ Poll attempt', i + 1, '/', maxAttempts);
      }
      
      const response = await fetch(`${KULFY_AGENT_URL}/status`);
      if (!response.ok) {
        console.log('[POLL] ⚠️ Status check failed, status:', response.status);
        continue;
      }
      
      const status = await response.json() as AgentStatus;
      console.log('[POLL] 📊 Full status response:', JSON.stringify(status).substring(0, 300));
      console.log('[POLL] 📊 is_running:', status.is_running);
      console.log('[POLL] 📊 status field:', status.status);
      
      // Check if generation is complete (not running anymore)
      if (!status.is_running) {
        console.log('[POLL] ✅ Generation completed (is_running=false), checking results...');
        
        // The agent returns upload_results directly in the state, not nested in summary
        const uploadResults = status.last_result?.upload_results || status.last_result?.summary?.upload_results;
        
        console.log('[POLL] 🔍 Upload results:', uploadResults);
        
        if (uploadResults && Array.isArray(uploadResults)) {
          const successful = uploadResults.filter(
            (r: UploadResult) => r.success && r.cid
          );
          console.log('[POLL] 🎨 Found', successful.length, 'successful uploads');
          if (successful.length > 0) {
            return {
              success: true,
              images: successful.map((r: UploadResult) => ({
                cid: r.cid!,
                title: r.title,
                id: r.id,
              })),
            };
          }
        }
        console.log('[POLL] ⚠️ No upload results found in completed generation');
        return { success: false, error: 'No memes were generated' };
      }
      
      // Wait 3 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.log('[POLL] ⚠️ Poll error (attempt', i + 1, '):', error instanceof Error ? error.message : 'Unknown');
      // Continue polling on error
    }
  }
  
  console.log('[POLL] ⏰ Polling timed out after', maxAttempts, 'attempts');
  return { success: false, error: 'Generation timed out' };
}

export async function POST(req: Request) {
  try {
    console.log('[CHAT API] 📨 Received request');
    const { messages }: { messages: UIMessage[] } = await req.json();
    console.log('[CHAT API] 📝 Messages count:', messages.length);
    
    // Get model from environment variable, default to gpt-4o-mini (cost-effective)
    const modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";
    
    // Convert messages first to get proper structure
    const modelMessages = convertToModelMessages(messages);
    
    // Helper function to extract text from UIMessage content
    function extractTextFromContent(content: unknown): string {
      if (typeof content === 'string') {
        return content;
      }
      if (Array.isArray(content)) {
        return content
          .map((part) => {
            if (typeof part === 'string') return part;
            if (typeof part === 'object' && part !== null) {
              // Handle { type: 'text', text: '...' } format
              if ('text' in part && typeof part.text === 'string') {
                return part.text;
              }
              // Handle other content types
              return JSON.stringify(part);
            }
            return String(part);
          })
          .join(' ');
      }
      return String(content);
    }
    
    // Check the last user message for URLs
    const lastMessage = messages[messages.length - 1];
    let userText = '';
    
    if (lastMessage?.role === 'user') {
      // UIMessage can have 'content' or 'parts'
      let content = null;
      
      if (typeof lastMessage === 'object') {
        if ('content' in lastMessage) {
          content = (lastMessage as { content: unknown }).content;
        } else if ('parts' in lastMessage) {
          content = (lastMessage as { parts: unknown }).parts;
        }
      }
      
      if (content) {
        userText = extractTextFromContent(content);
      } else {
        // Try to extract from model messages as fallback
        const lastModelMessage = modelMessages[modelMessages.length - 1];
        if (lastModelMessage && 'content' in lastModelMessage) {
          const msgContent = (lastModelMessage as { content: unknown }).content;
          userText = extractTextFromContent(msgContent);
        }
      }
    }
    
    console.log('[CHAT API] 💬 User text:', userText.substring(0, 100));
    
    const urls = extractUrls(userText);
    console.log('[CHAT API] 🔗 Detected URLs:', urls);
    
    // Check if user wants to approve/generate images from previous prompts
    const wantsToApprove = userText.toLowerCase().includes('generate') || 
                           userText.toLowerCase().includes('approve') ||
                           userText.toLowerCase().includes('yes') ||
                           userText.toLowerCase().includes('go ahead');
    
    // Check if user wants to directly create an image with DALL-E
    // Match if text ends with "create" (possibly with whitespace)
    const wantsDirectCreate = /\bcreate\s*$/i.test(userText.trim()) && urls.length === 0;
    
    console.log('[CHAT API] 🔍 Direct create check:', {
      wantsDirectCreate,
      endsWithCreate: /\bcreate\s*$/i.test(userText.trim()),
      urlsLength: urls.length,
      textEnd: userText.trim().slice(-20)
    });
    
    // Extract prompts from previous assistant messages if user wants to approve
    let promptsToUse: Array<{ title: string; text_overlay: string; visual_description: string }> | null = null;
    if (wantsToApprove) {
      console.log('[CHAT API] 🔍 User wants to approve/generate - searching for prompts...');
      console.log('[CHAT API] 📨 Total messages to search:', messages.length);
      
      // Look for prompts data in previous messages
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        console.log(`[CHAT API] 🔍 Checking message ${i}, role:`, msg.role);
        
        if (msg.role === 'assistant') {
          // UIMessage can have either 'content' or 'parts'
          let content = null;
          
          if (typeof msg === 'object') {
            if ('content' in msg) {
              content = msg.content;
            } else if ('parts' in msg) {
              // assistant-ui uses 'parts' array
              content = (msg as { parts: unknown }).parts;
            }
          }
          
          // DEBUG: Show the actual message structure
          console.log(`[CHAT API] 🔍 Message ${i} raw content type:`, typeof content);
          console.log(`[CHAT API] 🔍 Message ${i} raw content preview:`, JSON.stringify(content).substring(0, 200));
          console.log(`[CHAT API] 🔍 Message ${i} has 'parts':`, 'parts' in msg);
          console.log(`[CHAT API] 🔍 Message ${i} keys:`, Object.keys(msg));
          
          const contentStr = content ? extractTextFromContent(content) : null;
          
          if (contentStr) {
            console.log(`[CHAT API] 🔍 Message ${i} content length:`, contentStr.length);
            const hasPromptsData = contentStr.includes('KULFY_PROMPTS_DATA');
            console.log(`[CHAT API] 🔍 Message ${i} has prompts data:`, hasPromptsData);
            
            if (hasPromptsData) {
              console.log(`[CHAT API] 🔍 Message ${i} content preview:`, contentStr.substring(Math.max(0, contentStr.length - 300)));
            }
            
            // Try both formats: HTML comment and square brackets
            let promptsMatch = contentStr.match(/<!--\s*KULFY_PROMPTS_DATA:([\s\S]*?)\s*-->/);
            if (!promptsMatch) {
              promptsMatch = contentStr.match(/\[KULFY_PROMPTS_DATA\]([\s\S]*?)\[\/KULFY_PROMPTS_DATA\]/);
            }
            
            if (promptsMatch) {
              try {
                promptsToUse = JSON.parse(promptsMatch[1]);
                console.log('[CHAT API] ✅ Found prompts from previous message:', promptsToUse?.length, 'prompts');
                console.log('[CHAT API] 📋 Prompts preview:', JSON.stringify(promptsToUse, null, 2).substring(0, 300));
                break;
              } catch (e) {
                console.error('[CHAT API] ❌ Failed to parse prompts data:', e);
                console.error('[CHAT API] 🔍 Attempted to parse:', promptsMatch[1].substring(0, 200));
              }
            }
          } else {
            console.log(`[CHAT API] ⚠️ Message ${i} has no extractable content`);
          }
        }
      }
      
      if (!promptsToUse) {
        console.log('[CHAT API] ⚠️ No prompts found in message history!');
      }
    }
    
    // Only trigger concept generation if user has URLs AND hasn't approved yet
    const shouldGenerateMemes = urls.length > 0 && 
                                 !wantsToApprove && (
      userText.toLowerCase().includes('kulfy') || 
      userText.toLowerCase().includes('meme')
    );
    
    const shouldGenerateImages = wantsToApprove && promptsToUse && promptsToUse.length > 0;
    
    console.log('[CHAT API] 🎨 Should generate memes (concepts):', shouldGenerateMemes);
    console.log('[CHAT API] 🖼️  Should generate images (phase 2):', shouldGenerateImages);
    console.log('[CHAT API] 📊 Decision factors:', {
      wantsToApprove,
      hasPromptsToUse: !!promptsToUse,
      promptsCount: promptsToUse?.length || 0,
      wantsDirectCreate,
      shouldGenerateMemes,
      shouldGenerateImages
    });
    
    // System message
    const systemPrompt = `You are a helpful AI assistant for Kulfy, a Telugu meme platform. 
You can help users generate memes from URLs, browse the feed, upload content, and answer questions about the platform.
When meme generation is triggered, I will handle it automatically and add the results to our conversation.
Always be helpful and explain what you're doing.`;

    // DIRECT CREATE: User provided DALL-E prompt ending with "create"
    if (wantsDirectCreate) {
      console.log('[CHAT API] 🎨 Direct DALL-E creation requested via kulfy-agent');
      try {
        // Extract the prompt from user text (everything before "create")
        const promptMatch = userText.match(/([\s\S]*?)(?:\s+create\s*$)/i);
        const dallePrompt = promptMatch ? promptMatch[1].trim() : userText.replace(/\s+create\s*$/i, '').trim();
        
        console.log('[CHAT API] 📝 Extracted DALL-E prompt:', dallePrompt.substring(0, 200));
        
        // Parse the prompt to extract components
        const sceneMatch = dallePrompt.match(/SCENE:\s*([^\n]+(?:\n(?!TEXT OVERLAY:)[^\n]+)*)/i);
        const textOverlayMatch = dallePrompt.match(/TEXT OVERLAY:\s*"?([^"\n]+)"?/i);
        
        const visualDescription = sceneMatch ? sceneMatch[1].trim() : dallePrompt;
        const textOverlay = textOverlayMatch ? textOverlayMatch[1].trim() : '';
        
        console.log('[CHAT API] 📋 Parsed prompt:', {
          visualDescription: visualDescription.substring(0, 100),
          textOverlay: textOverlay.substring(0, 50)
        });
        
        // Create custom prompt in the format expected by kulfy-agent
        const customPrompts = [{
          title: 'Direct Meme Creation',
          text_overlay: textOverlay || 'Your meme text here',
          visual_description: visualDescription,
        }];
        
        // Call kulfy-agent's generate-memes endpoint (step 3: GENERATE)
        console.log('[CHAT API] 📡 Calling kulfy-agent GENERATE step:', `${KULFY_APP_URL}/api/agent/generate-memes`);
        
        const generateResponse = await fetch(`${KULFY_APP_URL}/api/agent/generate-memes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ custom_prompts: customPrompts }),
        });
        
        console.log('[CHAT API] 📥 Generate-memes API response status:', generateResponse.status);
        
        if (generateResponse.ok) {
          const generateResult = await generateResponse.json();
          console.log('[CHAT API] ✅ Image generation started:', generateResult);
          
          // Poll for completion
          console.log('[CHAT API] ⏳ Polling for image generation...');
          const pollResult = await pollMemeGenerationStatus(60);
          
          console.log('[CHAT API] 📊 Poll result:', JSON.stringify(pollResult));
          
          if (pollResult.success && pollResult.images && pollResult.images.length > 0) {
            console.log('[CHAT API] 🎉 SUCCESS! Creating display message for', pollResult.images.length, 'images');
            
            const imageMarkdown = pollResult.images.map((img, idx) => {
              // Use the post ID to create a link to the Kulfy post page
              const postUrl = `${KULFY_APP_URL}/kulfy/${img.id}`;
              // Also include the direct image URL for embedding
              const imageUrl = `${KULFY_APP_URL}/api/image/${img.cid}`;
              console.log('[CHAT API] 🖼️  Image', idx + 1, 'Post URL:', postUrl);
              console.log('[CHAT API] 🖼️  Image', idx + 1, 'Image URL:', imageUrl);
              
              // Return markdown with embedded image and link to post
              return `[![${img.title || `Meme ${idx + 1}`}](${imageUrl})](${postUrl})\n\n**[View on Kulfy →](${postUrl})**`;
            }).join('\n\n---\n\n');
            
            const successMessage = `🎉 Successfully created your meme using DALL-E 3!\n\n${imageMarkdown}\n\n✅ Your meme has been uploaded to Kulfy and is pending moderation.`;
            
            console.log('[CHAT API] 📝 Success message:', successMessage);
            console.log('[CHAT API] 📤 Returning success response via streamText...');
            
            const result = streamText({
              model: openai(modelName),
              system: systemPrompt,
              messages: [
                ...modelMessages,
                {
                  role: 'assistant',
                  content: successMessage,
                },
              ],
            });
            
            return result.toUIMessageStreamResponse();
          } else {
            console.log('[CHAT API] ❌ Poll failed or no images');
            throw new Error(pollResult.error || 'Image generation failed');
          }
        } else {
          const errorData = await generateResponse.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(`Kulfy agent error: ${errorData.message || errorData.error || 'Unknown error'}`);
        }
      } catch (error: unknown) {
        console.error('[CHAT API] 💥 Direct create exception:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorContent = `❌ Error creating image: ${errorMessage}. Please try again with a different prompt or check that the Kulfy agent service is running.`;
        
        // Return error response immediately
        const result = streamText({
          model: openai(modelName),
          system: systemPrompt,
          messages: [
            ...modelMessages,
            {
              role: 'assistant',
              content: errorContent,
            },
          ],
        });
        
        return result.toUIMessageStreamResponse();
      }
    }
    // PHASE 2: Generate images with approved/edited prompts
    else if (shouldGenerateImages && promptsToUse) {
      console.log('[CHAT API] 🚀 Phase 2: Generating images with', promptsToUse.length, 'prompts');
      try {
        // Convert prompts to the format expected by the API
        const customPrompts = promptsToUse.map((p) => ({
          title: p.title,
          text_overlay: p.text_overlay,
          visual_description: p.visual_description,
        }));
        
        console.log('[CHAT API] 📡 Calling generate-memes API with custom prompts:', `${KULFY_APP_URL}/api/agent/generate-memes`);
        
        const imagesResponse = await fetch(`${KULFY_APP_URL}/api/agent/generate-memes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ custom_prompts: customPrompts }),
        });

        console.log('[CHAT API] 📥 Generate-memes API response status:', imagesResponse.status);
        
        if (imagesResponse.ok) {
          const imagesInitResult = await imagesResponse.json();
          console.log('[CHAT API] ✅ Image generation started:', imagesInitResult);
          
          // Poll for completion
          console.log('[CHAT API] ⏳ Polling for image generation...');
          const pollResult = await pollMemeGenerationStatus(60);
          
          if (pollResult.success && pollResult.images && pollResult.images.length > 0) {
            const imageMarkdown = pollResult.images.map((img, idx) => {
              // Use the post ID to create a link to the Kulfy post page
              const postUrl = `${KULFY_APP_URL}/kulfy/${img.id}`;
              const imageUrl = `${KULFY_APP_URL}/api/image/${img.cid}`;
              // Return markdown with embedded image and link to post
              return `[![${img.title || `Meme ${idx + 1}`}](${imageUrl})](${postUrl})\n\n**[View on Kulfy →](${postUrl})**`;
            }).join('\n\n---\n\n');
            
            const responseMessage = `🎉 Successfully generated ${pollResult.images.length} meme(s)!\n\n${imageMarkdown}\n\n✅ All memes have been uploaded to Kulfy and are pending moderation.`;
            
            modelMessages.push({
              role: 'assistant',
              content: responseMessage,
            });
          } else {
            modelMessages.push({
              role: 'assistant',
              content: `Image generation completed but no images were created. ${pollResult.error || 'Unknown error'}`,
            });
          }
        } else {
          const errorData = await imagesResponse.json().catch(() => ({ message: 'Unknown error' }));
          modelMessages.push({
            role: 'assistant',
            content: `Failed to generate images: ${errorData.message || 'Unknown error'}`,
          });
        }
      } catch (error: unknown) {
        console.error('[CHAT API] 💥 Image generation exception:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        modelMessages.push({
          role: 'assistant',
          content: `Error generating images: ${errorMessage}`,
        });
      }
    }
    // PHASE 1: Generate concepts and prompts
    else if (shouldGenerateMemes && urls.length > 0) {
      console.log('[CHAT API] 🚀 Starting two-phase meme generation for URLs:', urls);
      try {
        // PHASE 1: Generate concepts and prompts
        console.log('[CHAT API] 📡 Phase 1: Calling generate-concepts API:', `${KULFY_APP_URL}/api/agent/generate-concepts`);
        
        const conceptsResponse = await fetch(`${KULFY_APP_URL}/api/agent/generate-concepts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls }),
        });

        console.log('[CHAT API] 📥 Generate-concepts API response status:', conceptsResponse.status);
        
        if (conceptsResponse.ok) {
          const conceptsInitResult = await conceptsResponse.json();
          console.log('[CHAT API] ✅ Concept generation started:', conceptsInitResult);
          
          // Poll for concepts completion (up to 2 minutes = 40 attempts * 3 seconds)
          console.log('[CHAT API] ⏳ Polling for concepts...');
          let conceptsReady = false;
          let conceptsData: ConceptData | null = null;
          
          for (let i = 0; i < 40; i++) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const statusResponse = await fetch(`${KULFY_AGENT_URL}/status`);
            if (statusResponse.ok) {
              const status = await statusResponse.json() as AgentStatus;
              
              if (!status.is_running && status.last_result?.concepts) {
                conceptsReady = true;
                conceptsData = status.last_result.concepts;
                console.log('[CHAT API] ✅ Concepts ready!', conceptsData);
                break;
              }
            }
          }
          
          if (conceptsReady && conceptsData?.dalle_prompts) {
            console.log('[CHAT API] 🎨 Generated', conceptsData.dalle_prompts.length, 'prompts for review');
            
            // Format prompts for display in chat
            const promptsDisplay = conceptsData.dalle_prompts.map((prompt, idx: number) => {
              return `### Meme ${idx + 1}: ${prompt.title || 'Untitled'}

**Text Overlay:** ${prompt.text_overlay}

**Visual Description:** ${prompt.visual_description}

**DALL-E Prompt:**
\`\`\`
${prompt.dalle_prompt}
\`\`\`

---`;
            }).join('\n\n');
            
            const reviewMessage = `🎨 I've analyzed the content from your URL(s) and generated ${conceptsData.dalle_prompts.length} meme concepts with DALL-E prompts!

**Review the prompts below. You can:**
1. ✅ Approve and generate images as-is
2. ✏️ Edit any prompts before generating
3. 🗑️ Remove prompts you don't want

---

${promptsDisplay}

---

**To proceed:**
- Reply with "generate" or "approve" to create images with these prompts
- Reply with "edit prompt 1: [your changes]" to modify a specific prompt
- Or describe the changes you'd like to make!

**Note:** Each prompt includes the visual description and text overlay that will be sent to DALL-E 3.`;
            
            console.log('[CHAT API] ✨ Returning prompts review message immediately');
            
            // Store prompts data at the END of the message in a hidden section
            const promptsDataJson = JSON.stringify(conceptsData.dalle_prompts);
            const fullReviewMessage = `${reviewMessage}\n\n<!-- KULFY_PROMPTS_DATA:${promptsDataJson} -->`;
            
            console.log('[CHAT API] 📦 Embedded prompts data length:', promptsDataJson.length);
            console.log('[CHAT API] ✅ Phase 1 completed - prompts ready for review');
            console.log('[CHAT API] 📤 Returning formatted message with', conceptsData.dalle_prompts.length, 'prompts');
            
            // Return the pre-formatted message as a text response
            // We use streamText with a forced output by providing the exact text in a system message
            const result = streamText({
              model: openai(modelName),
              system: `You must return EXACTLY the following message, word for word, with no modifications:\n\n${fullReviewMessage}`,
              messages: [
                {
                  role: 'user',
                  content: 'Please display the meme concepts.',
                },
              ],
            });
            
            return result.toUIMessageStreamResponse();
          } else {
            console.log('[CHAT API] ⚠️ Concepts generation failed or timed out');
            modelMessages.push({
              role: 'assistant',
              content: `I tried to generate meme concepts from your URL, but the process timed out or encountered an error. Please try again.`,
            });
          }
        } else {
          const errorData = await conceptsResponse.json().catch(() => ({ message: 'Unknown error', error: 'API Error' }));
          console.log('[CHAT API] ❌ Generate-concepts API error:', errorData);
          modelMessages.push({
            role: 'assistant',
            content: `I encountered an error while trying to generate concepts: ${errorData.message || errorData.error || 'The service is currently unavailable'}. Please check that the Kulfy agent service is running and try again.`,
          });
        }
      } catch (error: unknown) {
        console.error('[CHAT API] 💥 Concept generation exception:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        modelMessages.push({
          role: 'assistant',
          content: `I tried to generate concepts from your URL, but encountered an error: ${errorMessage}. Please try again later.`,
        });
      }
    }

    console.log('[CHAT API] 🤖 Starting AI stream with', modelMessages.length, 'messages');
    const result = streamText({
      model: openai(modelName),
      system: systemPrompt,
      messages: modelMessages,
    });

    console.log('[CHAT API] 📤 Returning stream response');
    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    console.error('[CHAT API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
