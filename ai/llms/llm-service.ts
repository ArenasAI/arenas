import { getModelById } from '../models';

interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
}

interface LLMResponse {
  text: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export async function getLLMResponse(
  modelId: string,
  prompt: string,
  options: LLMOptions = {}
): Promise<LLMResponse> {
  const model = getModelById(modelId);
  if (!model) throw new Error('Invalid model ID');

  try {
    const response = await fetch(`{process.env.ARENAS_SERVER}/api/v1/${model.provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.apiIdentifier,
        prompt,
        temperature: options.temperature ?? 1,
        maxTokens: options.maxTokens ?? model.maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get response');
    }

    return response.json();
  } catch (error) {
    console.error('LLM error:', error);
    throw error;
  }
}
