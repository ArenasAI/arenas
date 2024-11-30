import { OLLAMA_BASE_URL, DEFAULT_MODEL } from './ollama-config';

interface ChatResponse {
  message: string;
  code?: string;
  visualization?: string;
}

export async function processUserPrompt(
  prompt: string,
  runtime: string
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt: generatePrompt(prompt, runtime),
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return parseResponse(data.response);
  } catch (error) {
    console.error('Error in processUserPrompt:', error);
    throw error;
  }
}

function generatePrompt(prompt: string, runtime: string): string {
  const systemPrompt = `You are an AI assistant specialized in ${runtime} programming, data analysis, and visualization. 
You provide clear, concise responses and include code examples when relevant.
When providing code, wrap it in triple backticks with the language specified.
Current runtime: ${runtime}

Example response format:
Here's how to create a simple plot in ${runtime}...
\`\`\`${runtime}
// code example here
\`\`\``;

  return `${systemPrompt}\n\nUser: ${prompt}\nAssistant:`;
}

function parseResponse(response: string): ChatResponse {
  // Extract code blocks
  const codeBlockRegex = /```[\s\S]*?```/g;
  const codeBlocks = response.match(codeBlockRegex);
  const code = codeBlocks 
    ? codeBlocks[0].replace(/```[\w]*\n?/g, '').trim()
    : undefined;

  // Remove code blocks from the main message
  const message = response.replace(codeBlockRegex, '').trim();
  return {
    message,
    code,
    visualization: undefined, // Will be implemented when we add visualization support
  };
}

export async function checkOllamaStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/version`);
    return response.ok;
  } catch {
    return false;
  }
}
