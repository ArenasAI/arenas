import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4-turbo'),
    system: 'You are an expert software developer',
    messages,
  });

  return result.toDataStreamResponse();
}








// import { NextRequest, NextResponse } from 'next/server';
// import { OLLAMA_BASE_URL, DEFAULT_MODEL } from '@/app/chat/ollama/ollama-config';

// export async function POST(req: NextRequest) {
//   try {
//     const { prompt, runtime } = await req.json();

//     if (!prompt) {
//       return NextResponse.json(
//         { error: 'Prompt is required' },
//         { status: 400 }
//       );
//     }

//     const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         model: DEFAULT_MODEL,
//         prompt: generatePrompt(prompt, runtime),
//         stream: false,
//       }),
//     });

//     if (!response.ok) {
//       throw new Error(`Ollama API error: ${response.statusText}`);
//     }

//     const data = await response.json();
//     const parsedResponse = parseResponse(data.response);

//     return NextResponse.json(parsedResponse);
//   } catch (error) {
//     console.error('Chat API error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
//       { status: 500 }
//     );
//   }
// }

// function generatePrompt(prompt: string, runtime: string): string {
//   const systemPrompt = `You are an AI assistant specialized in ${runtime} programming, data analysis, and visualization. 
// You provide clear, concise responses and include code examples when relevant.
// When providing code, wrap it in triple backticks with the language specified.
// Current runtime: ${runtime}`;

//   return `${systemPrompt}\n\nUser: ${prompt}\nAssistant:`;
// }

// function parseResponse(response: string) {
//   const codeBlockRegex = /```[\s\S]*?```/g;
//   const codeBlocks = response.match(codeBlockRegex);
//   const code = codeBlocks 
//     ? codeBlocks[0].replace(/```[\w]*\n?/g, '').trim()
//     : null;

//   const message = response.replace(codeBlockRegex, '').trim();

//   return {
//     message,
//     code,
//     visualization: null,
//   };
// }

// export async function GET() {
//   try {
//     const response = await fetch(`${OLLAMA_BASE_URL}/api/version`);
//     const data = await response.json();
//     return NextResponse.json({ status: 'online', version: data.version });
//   } catch (error) {
//     return NextResponse.json(
//       { status: 'offline', error: 'Cannot connect to Ollama' },
//       { status: 503 }
//     );
//   }
// }