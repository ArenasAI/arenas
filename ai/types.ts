export interface OllamaApiConfiguration {
  baseUrl?: string;
}

export interface QwenApiConfiguration {
  apiKey?: string;
  baseUrl?: string;
}

export interface ModelResponse {
  content: string;
  error?: string;
}