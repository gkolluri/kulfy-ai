import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";

const KULFY_AGENT_URL = process.env.KULFY_AGENT_URL || 'http://localhost:8001';
const KULFY_APP_URL = process.env.NEXT_PUBLIC_KULFY_APP_URL || 'http://localhost:3000';

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

interface AgentStatus {
  status: string;
  last_result?: {
    summary?: {
      upload_results?: UploadResult[];
    };
  };
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
      console.log('[POLL] 📊 Agent status:', status.status);
      
      if (status.status === 'idle' || status.status === 'completed') {
        console.log('[POLL] ✅ Generation completed, checking results...');
        if (status.last_result?.summary?.upload_results) {
          const successful = status.last_result.summary.upload_results.filter(
            (r: UploadResult) => r.success && r.cid
          );
          console.log('[POLL] 🎨 Found', successful.length, 'successful uploads');
          return {
            success: true,
            images: successful.map((r: UploadResult) => ({
              cid: r.cid!,
              title: r.title,
              id: r.id,
            })),
          };
        }
        console.log('[POLL] ⚠️ No upload results found');
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
    
    // Check the last user message for URLs
    const lastMessage = messages[messages.length - 1];
    let userText = '';
    
    if (lastMessage?.role === 'user') {
      // UIMessage content can be string or array of parts
      if (typeof lastMessage === 'object' && 'content' in lastMessage) {
        const content = (lastMessage as { content: unknown }).content;
        userText = typeof content === 'string' 
          ? content 
          : JSON.stringify(content);
      } else {
        // Try to extract from model messages
        const lastModelMessage = modelMessages[modelMessages.length - 1];
        if (lastModelMessage && 'content' in lastModelMessage) {
          const content = (lastModelMessage as { content: unknown }).content;
          userText = typeof content === 'string' 
            ? content 
            : Array.isArray(content) 
              ? content.map((c: unknown) => typeof c === 'string' ? c : JSON.stringify(c)).join(' ')
              : JSON.stringify(content);
        }
      }
    }
    
    console.log('[CHAT API] 💬 User text:', userText.substring(0, 100));
    
    const urls = extractUrls(userText);
    console.log('[CHAT API] 🔗 Detected URLs:', urls);
    
    const shouldGenerateMemes = urls.length > 0 && (
      userText.toLowerCase().includes('kulfy') || 
      userText.toLowerCase().includes('generate') ||
      userText.toLowerCase().includes('meme')
    );
    
    console.log('[CHAT API] 🎨 Should generate memes:', shouldGenerateMemes);
    
    // System message
    const systemPrompt = shouldGenerateMemes 
      ? `You are a helpful AI assistant for Kulfy, a Telugu meme platform. 
When a user provides a URL and asks to generate memes (or says "kulfy" with a URL), you MUST use the generateMemes tool to create memes from that URL.
After the tool completes, display the generated memes as images in your response using markdown image syntax.
Always be helpful and explain what you're doing.`
      : `You are a helpful AI assistant for Kulfy, a Telugu meme platform. 
You can help users generate memes from URLs, browse the feed, upload content, and answer questions about the platform.`;

    // If URLs detected, handle meme generation directly before AI response
    if (shouldGenerateMemes && urls.length > 0) {
      console.log('[CHAT API] 🚀 Starting meme generation for URLs:', urls);
      try {
        // Trigger meme generation
        console.log('[CHAT API] 📡 Calling generate-memes API:', `${KULFY_APP_URL}/api/agent/generate-memes`);
        const response = await fetch(`${KULFY_APP_URL}/api/agent/generate-memes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls, count: 5 }),
        });

        console.log('[CHAT API] 📥 Generate-memes API response status:', response.status);
        
        if (response.ok) {
          const initResult = await response.json();
          console.log('[CHAT API] ✅ Meme generation started:', initResult);
          
          // Poll for completion (up to 3 minutes = 60 attempts * 3 seconds)
          console.log('[CHAT API] ⏳ Starting to poll for completion...');
          const pollResult = await pollMemeGenerationStatus(60);
          
          console.log('[CHAT API] 📊 Poll result:', {
            success: pollResult.success,
            imageCount: pollResult.images?.length || 0,
            error: pollResult.error,
          });
          
          if (pollResult.success && pollResult.images && pollResult.images.length > 0) {
            console.log('[CHAT API] 🎨 Generated memes:', pollResult.images.map(img => ({
              cid: img.cid,
              title: img.title,
            })));
            
            // Format images as markdown with image URLs
            const imageMarkdown = pollResult.images.map((img, idx) => {
              const imageUrl = `${KULFY_APP_URL}/api/image/${img.cid}`;
              return `![${img.title || `Meme ${idx + 1}`}](${imageUrl})`;
            }).join('\n\n');
            
            const responseMessage = `🎉 Successfully generated ${pollResult.images.length} meme(s) from the provided URL(s)!\n\n${imageMarkdown}\n\nAll memes have been uploaded to Kulfy and are pending moderation. You can view them in the feed once approved!`;
            
            console.log('[CHAT API] ✨ Adding response message to conversation');
            console.log('[CHAT API] 📝 Response preview:', responseMessage.substring(0, 200));
            
            // Add assistant message with images to the conversation
            modelMessages.push({
              role: 'assistant',
              content: responseMessage,
            });
            
            console.log('[CHAT API] ✅ Meme generation completed successfully!');
          } else {
            console.log('[CHAT API] ⚠️ Meme generation failed or no images:', pollResult.error);
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.log('[CHAT API] ❌ Generate-memes API error:', errorData);
        }
      } catch (error: unknown) {
        // Continue with normal chat if meme generation fails
        console.error('[CHAT API] 💥 Meme generation exception:', error);
        if (error instanceof Error) {
          console.error('[CHAT API] Error message:', error.message);
          console.error('[CHAT API] Error stack:', error.stack);
        }
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
