import { openai } from '@ai-sdk/openai';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';


import { customMiddleware } from './custom-middleware';
import { models } from './models';
import { OllamaClient } from './ollama';
import { QwenClient } from './qwen';


export const getModelClient = (modelType: string) => {
  switch (modelType) {
    case 'ollama':
      return new OllamaClient({
        baseUrl: process.env.OLLAMA_API_URL
      });
    case 'qwen':
      return new QwenClient({
        apiKey: process.env.QWEN_API_KEY,
        baseUrl: process.env.QWEN_API_URL
      });
    default:
      return openai;
  }
};

export const customModel = (apiIdentifier: string) => {
  const model = models.find(m => m.apiIdentifier === apiIdentifier);
  const client = getModelClient(model?.type || 'openai');

  return wrapLanguageModel({
    model: client(apiIdentifier),
    middleware: customMiddleware,
  });
};
