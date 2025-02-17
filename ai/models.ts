import { openai } from '@ai-sdk/openai';
import { fireworks } from '@ai-sdk/fireworks';
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
  provider: string;
  contextWindow?: number;
  maxTokens?: number;
  streaming?: boolean;
  tools?: string[];
  disabled?: boolean;
}

export const models: Array<Model> = [
  {
    id: 'arenas',
    label: 'Arenas (Coming soon)',
    apiIdentifier: 'arenas',
    description: 'Specialized data analysis model with visualization tools',
    provider: 'arenas',
    contextWindow: 32768,
    maxTokens: 8192,
    streaming: true,
    disabled: true
  },
  {
      id: 'gpt-4o',
      label: 'GPT-4o',
      apiIdentifier: 'gpt-4o',
      description: 'Most capable OpenAI model for complex tasks',
      provider: 'openai',
      contextWindow: 128000,
      maxTokens: 4096,
      streaming: true
  },
  {
    id: 'claude-3-5-sonnet',
    label: 'Claude 3.5 Sonnet',
    apiIdentifier: 'claude-3-5-sonnet-20241022',
    description: 'Anthropic\'s latest model for advanced analysis',
    provider: 'anthropic',
    contextWindow: 200000,
    maxTokens: 4096,
    streaming: true
  },
  {
    id: 'deepseek-r1',
    label: 'Deepseek R1',
    apiIdentifier: 'deepseek/deepseek-reasoner',
    description: 'Optimized for code generation and analysis',
    provider: 'deepseek',
    contextWindow: 32768,
    streaming: true
  },
  {
    id: 'deepseek-chat',
    label: 'Deepseek Chat',
    apiIdentifier: 'deepseek-chat',
    description: 'General purpose chat model from Deepseek',
    provider: 'deepseek',
    contextWindow: 32768,
    streaming: true
  },
  {
    id: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    apiIdentifier: 'gemini-2.0-flash',
    description: 'Google\'s latest advanced language model',
    provider: 'gemini',
    contextWindow: 32768,
    maxTokens: 2048,
    streaming: true
  }
] as const;

export const DEFAULT_MODEL_NAME = 'deepseek-chat';

export type ModelId = typeof models[number]['id'];

// Helper function to get model by ID
export function getModelById(id: string): Model | undefined {
  return models.find(model => model.id === id);
}

// Helper function to get available tools for a model
export function getModelTools(id: string): string[] {
  return getModelById(id)?.tools || [];
}

// Helper to check if a model supports streaming
export function supportsStreaming(id: string): boolean {
  return getModelById(id)?.streaming ?? false;
}

export const myProvider = customProvider({
  languageModels: {
    'chat-model-small': openai('gpt-4o-mini'),
    'chat-model-large': openai('gpt-4o'),
    'chat-model-reasoning': wrapLanguageModel({
      model: fireworks('accounts/fireworks/models/deepseek-r1'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': openai('gpt-4-turbo'),
    'artifact-model': openai('gpt-4o-mini'),
  },
  imageModels: {
    'small-model': openai.image('dall-e-2'),
    'large-model': openai.image('dall-e-3'),
  },
});