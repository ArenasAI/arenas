// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
  type: 'ollama' | 'qwen' | 'openai';
  capabilities: string[];
}

export const models: Array<Model> = [
  {
    id: 'llama2',
    label: 'Llama 2',
    apiIdentifier: 'llama2',
    type: 'ollama',
    description: 'Powerful open-source model for data analysis and general tasks',
    capabilities: ['data-analysis', 'visualization', 'general']
  },
  {
    id: 'gpt-4o',
    label: 'GPT 4o',
    apiIdentifier: 'gpt-4o',
    type: 'openai',
    description: 'For complex, multi-step tasks',
    capabilities: ['data-analysis', 'visualization', 'general']
  },
  {
    id: 'codellama',
    label: 'Code Llama',
    apiIdentifier: 'codellama',
    type: 'ollama',
    description: 'Specialized in code generation and data manipulation',
    capabilities: ['code', 'data-analysis', 'technical']
  },
  {
    id: 'mistral',
    label: 'Mistral',
    apiIdentifier: 'mistral',
    type: 'ollama',
    description: 'Excellent for reasoning and structured analysis',
    capabilities: ['reasoning', 'data-analysis', 'general']
  },
  {
    id: 'qwen-7b',
    label: 'Qwen 7B',
    apiIdentifier: 'qwen-7b',
    type: 'qwen',
    description: 'Balanced model for data analysis and visualization',
    capabilities: ['data-analysis', 'visualization', 'general']
  }
] as const;

export const DEFAULT_MODEL_NAME: string = 'llama2';
