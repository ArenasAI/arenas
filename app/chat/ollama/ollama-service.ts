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
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        runtime,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      message: data.message,
      code: data.code,
      visualization: data.visualization,
    };
  } catch (error) {
    console.error('Error in processUserPrompt:', error);
    throw error;
  }
}

export async function checkOllamaStatus(): Promise<boolean> {
  try {
    const response = await fetch('/api/chat');
    const data = await response.json();
    return data.status === 'online';
  } catch (error) {
    return false;
  }
}
