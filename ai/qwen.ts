import { QwenApiConfiguration } from './types';

export class QwenClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: QwenApiConfiguration) {
    this.baseUrl = config.baseUrl || 'https://api.qwen.ai/v1';
    this.apiKey = config.apiKey || '';
  }

  async generateCompletion(params: {
    model: string;
    prompt: string;
    stream?: boolean;
  }) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: [{ role: 'user', content: params.prompt }],
        stream: params.stream,
      }),
    });

    if (!response.ok) {
      throw new Error(`Qwen API error: ${response.statusText}`);
    }

    return response;
  }
} 