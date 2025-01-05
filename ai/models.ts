// models are declared here.

export interface Model {
    id: string;
    label: string;
    apiIdentifier: string;
    description:string;
}

export const models: Array<Model> = [
    {
      id: 'gpt-4o-mini',
      label: 'GPT 4o mini',
      apiIdentifier: 'gpt-4o-mini',
      description: 'Small model for fast, lightweight tasks',
    },
    {
      id: 'gpt-4o',
      label: 'GPT 4o',
      apiIdentifier: 'gpt-4o',
      description: 'For complex, multi-step tasks',
    },
    {
      id: 'xai',
      label: 'xAI',
      apiIdentifier: 'xai',
      description: 'for complex math problems'
    },
    {
      id: 'claude-3.5-sonnet',
      label: 'claude 3.5 sonnet',
      apiIdentifier: 'claude-3.5-sonnet',
      description: 'good for math and reasoning'
    },
    {
      id: 'Default',
      label: 'Default',
      apiIdentifier: 'arenas',
      description: 'Arenas default model suitable for most tasks'
    }
  ] as const;

export const DEFAULT_MODEL_NAME = 'arenas model';