// models are declared here.

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
}

export const models: Array<Model> = [
  {
    id: 'arenas',
    label: 'Arenas',
    apiIdentifier: 'arenas',
    description: 'Specialized data analysis model with visualization tools',
    provider: 'arenas',
    contextWindow: 32768,
    maxTokens: 8192,
    streaming: true,
    tools: ['data_analysis', 'visualization', 'statistical_testing']
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
    apiIdentifier: 'claude-3-5-sonnet',
    description: 'Anthropic\'s latest model for advanced analysis',
    provider: 'anthropic',
    contextWindow: 200000,
    maxTokens: 4096,
    streaming: true
  },
  {
    id: 'deepseek',
    label: 'Deepseek',
    apiIdentifier: 'deepseek/deepseek-coder',
    description: 'Deepseek MoE architecture for versatile feature delivery',
    provider: 'deepseek',
  }
] as const;

export const DEFAULT_MODEL_NAME = 'gpt-4o';

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
