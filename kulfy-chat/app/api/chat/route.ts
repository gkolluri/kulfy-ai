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
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${KULFY_AGENT_URL}/status`);
      if (!response.ok) continue;
      
      const status = await response.json() as AgentStatus;
      
      if (status.status === 'idle' || status.status === 'completed') {
        if (status.last_result?.summary?.upload_results) {
          const successful = status.last_result.summary.upload_results.filter(
            (r: UploadResult) => r.success && r.cid
          );
          return {
            success: true,
            images: successful.map((r: UploadResult) => ({
              cid: r.cid!,
              title: r.title,
              id: r.id,
            })),
          };
        }
        return { success: false, error: 'No memes were generated' };
      }
      
      // Wait 3 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch {
      // Continue polling on error
    }
  }
  
  return { success: false, error: 'Generation timed out' };
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    
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
    
    const urls = extractUrls(userText);
    const shouldGenerateMemes = urls.length > 0 && (
      userText.toLowerCase().includes('kulfy') || 
      userText.toLowerCase().includes('generate') ||
      userText.toLowerCase().includes('meme')
    );
    
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
      try {
        // Trigger meme generation
        const response = await fetch(`${KULFY_APP_URL}/api/agent/generate-memes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls, count: 5 }),
        });

        if (response.ok) {
          // Poll for completion (up to 3 minutes = 60 attempts * 3 seconds)
          const pollResult = await pollMemeGenerationStatus(60);
          
          if (pollResult.success && pollResult.images && pollResult.images.length > 0) {
            // Format images as markdown with image URLs
            const imageMarkdown = pollResult.images.map((img, idx) => {
              const imageUrl = `${KULFY_APP_URL}/api/image/${img.cid}`;
              return `![${img.title || `Meme ${idx + 1}`}](${imageUrl})`;
            }).join('\n\n');
            
            // Add assistant message with images to the conversation
            modelMessages.push({
              role: 'assistant',
              content: `🎉 Successfully generated ${pollResult.images.length} meme(s) from the provided URL(s)!\n\n${imageMarkdown}\n\nAll memes have been uploaded to Kulfy and are pending moderation. You can view them in the feed once approved!`,
            });
          }
        }
      } catch (error: unknown) {
        // Continue with normal chat if meme generation fails
        console.error('[CHAT API] Meme generation error:', error);
      }
    }

    const result = streamText({
      model: openai(modelName),
      system: systemPrompt,
      messages: modelMessages,
    });

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
