import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  
  // Get model from environment variable, default to gpt-4o-mini (cost-effective)
  const modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";
  
  // Convert messages
  const modelMessages = convertToModelMessages(messages);
  
  // System message
  const systemPrompt = `You are a helpful AI assistant for Kulfy, a Telugu meme platform.`;
  
  const result = streamText({
    model: openai(modelName),
    system: systemPrompt,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
