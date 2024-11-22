import { NextRequest, NextResponse } from 'next/server';
import { OLLAMA_BASE_URL, DEFAULT_MODEL } from '@/app/chat/ollama/ollama-config';

async function generateOllamaPrompt(prompt: string, runtime: string) {
  const systemPrompt = `You are a helpful AI assistant specializing in ${runtime} programming. 
  Provide clear, concise responses with code examples when appropriate.`;

  return `${systemPrompt}\n\nUser: ${prompt}`;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, runtime } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // For testing without Ollama
    // Remove this and uncomment the Ollama code when Ollama is set up
    return NextResponse.json({
      message: `I received your prompt about "${prompt}" for ${runtime}. This is a temporary response while Ollama integration is being set up.`,
      code: null,
      visualization: null,
    });

    /* Uncomment when Ollama is set up
    const formattedPrompt = await generateOllamaPrompt(prompt, runtime);

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt: formattedPrompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract code blocks from the response if they exist
    const codeBlockRegex = /```[\s\S]*?```/g;
    const codeBlocks = data.response.match(codeBlockRegex);
    const code = codeBlocks ? codeBlocks[0].replace(/```[\w]*\n?/g, '') : null;

    // Remove code blocks from the main message
    const message = data.response.replace(codeBlockRegex, '').trim();

    return NextResponse.json({
      message,
      code,
      visualization: null,
    });
    */

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Chat API is running' });
}
