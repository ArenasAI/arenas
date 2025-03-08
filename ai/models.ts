import { openai } from '@ai-sdk/openai';
import { deepseek } from '@ai-sdk/deepseek';
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
}

export const models: Array<Model> = [
  {
    id: 'arenas',
    label: 'Arenas (Coming soon)',
    apiIdentifier: 'arenas',
    streaming: true,
    disabled: true
  },
  {
      id: 'gpt-4o',
      label: 'GPT-4o',
      apiIdentifier: 'gpt-4o',
      streaming: true
  },
  {
    id: 'claude-3-7-sonnet',
    label: 'Claude 3.7 Sonnet',
    apiIdentifier: 'claude-3-7-sonnet-20250219',
    streaming: true,
    disabled: true
  },
  {
    id: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    apiIdentifier: 'gemini-2.0-flash',
    streaming: true
  },
  {
    id: 'gpt-4.5',
    label: 'GPT-4.5',
    apiIdentifier: 'gpt-4.5',
    streaming: true,
    disabled: true
  },
  {
    id: 'deepseek-reasoner',
    label: 'Deepseek',
    apiIdentifier: 'deepseek-reasoner',
    streaming: true
  }
] as const;

export const DEFAULT_MODEL_NAME = 'deepseek-chat';

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
    'gpt-4.5': openai('gpt-4.5'),
  }
})