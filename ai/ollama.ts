import { OllamaApiConfiguration } from './types';

export class OllamaClient {
  private baseUrl: string;

  constructor(config: OllamaApiConfiguration) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
  }

  async generateCompletion(params: {
    model: string;
    prompt: string;
    stream?: boolean;
  }) {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.model,
        prompt: params.prompt,
        stream: params.stream,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    return response;
  }
}