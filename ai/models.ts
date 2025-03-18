import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { fireworks } from '@ai-sdk/fireworks';
import { google } from '@ai-sdk/google';
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  streaming?: boolean;
  tools?: string[];
  disabled?: boolean;
  requiresPro?: boolean;
}

export const models: Array<Model> = [
  {
    id: 'arenas',
    label: 'Arenas (Coming soon)',
    apiIdentifier: 'arenas',
    streaming: true,
    disabled: true,
    requiresPro: true
  },
  {
      id: 'gpt-4o',
      label: 'GPT-4o',
      requiresPro: true,
      apiIdentifier: 'gpt-4o',
      streaming: true,
      disabled: true
  },
  {
    id: 'claude-3-7-sonnet',
    apiIdentifier: 'claude-3-7-sonnet-20250219',
    streaming: true,
    disabled: true,
    requiresPro: true,
    label: 'Claude 3.7 Sonnet'
  },
  {
    id: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    apiIdentifier: 'gemini-2.0-flash',
    streaming: true
  },
  {
    id: 'gpt-4.5',
    apiIdentifier: 'gpt-4.5-preview',
    streaming: true,
    disabled: true,
    requiresPro: true,
    label: 'GPT-4.5'
  },
  {
    id: 'deepseek-reasoner',
    label: 'Deepseek',
    apiIdentifier: 'deepseek-reasoner',
    streaming: true
  }
] as const;

export const DEFAULT_MODEL_NAME = 'gpt-4o';

export function getModelById(id: string): Model | undefined {
  return models.find(model => model.id === id);
}

export function getModelTools(id: string): string[] {
  return getModelById(id)?.tools || [];
}

export function supportsStreaming(id: string): boolean {
  return getModelById(id)?.streaming ?? false;
}

export const myProvider = customProvider({
  languageModels: {
    'gpt-4o-mini': openai('gpt-4o-mini'),
    'gpt-4o': openai('gpt-4o'),
    'gemini-2.0-flash': google('models/gemini-2.0-flash-exp'),
    'claude-3-7-sonnet': anthropic('claude-3-7-sonnet-20250219'),
    'deepseek-reasoner': wrapLanguageModel({
      model: fireworks('accounts/fireworks/models/deepseek-r1'),
      middleware: extractReasoningMiddleware({ tagName: 'think'}),
    }),
    'gpt-4.5': openai('gpt-4.5-preview'),
  },
  imageModels: {
    'dall-e-3': openai.image('dall-e-3', { maxImagesPerCall: 1 }),
    'dall-e-2': openai.image('dall-e-2', { maxImagesPerCall: 1 }),
  }
})