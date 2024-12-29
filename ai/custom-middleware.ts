import { Experimental_LanguageModelV1Middleware } from 'ai';

import { models } from './models';
import { OllamaClient } from './ollama';
import { getTaskPrompt, TASK_TYPES } from './prompts';
import { QwenClient } from './qwen';


export const customMiddleware: Experimental_LanguageModelV1Middleware = {
  async chatCompletion(params: { messages: any[]; model: string }, completion: Function) {
    const messages = params.messages;
    const lastMessage = messages[messages.length - 1];
    const modelType = models.find(m => m.apiIdentifier === params.model)?.type;

    // Detect task type from message content or metadata
    const taskType = detectTaskType(lastMessage.content);
    const prompt = getTaskPrompt(taskType, lastMessage.content);

    switch (modelType) {
      case 'ollama':
        const ollamaClient = new OllamaClient({
          baseUrl: process.env.OLLAMA_API_URL
        });
        return ollamaClient.generateCompletion({
          model: params.model,
          prompt: prompt,
          stream: true
        });

      case 'qwen':
        const qwenClient = new QwenClient({
          apiKey: process.env.QWEN_API_KEY,
          baseUrl: process.env.QWEN_API_URL
        });
        return qwenClient.generateCompletion({
          model: params.model,
          prompt: prompt,
          stream: true
        });

      default:
        return completion(params);
    }
  }
};

function detectTaskType(content: string): string {
  // Simple task detection based on content keywords
  const contentLower = content.toLowerCase();
  
  // Check for analysis tasks
  if (contentLower.includes('analyze') || contentLower.includes('analysis')) {
    if (contentLower.includes('data')) return TASK_TYPES.ANALYSIS.DATA;
    if (contentLower.includes('code')) return TASK_TYPES.ANALYSIS.CODE;
    if (contentLower.includes('financial')) return TASK_TYPES.ANALYSIS.FINANCIAL;
    if (contentLower.includes('statistics')) return TASK_TYPES.ANALYSIS.STATISTICAL;
  }

  // Check for visualization tasks
  if (contentLower.includes('visualize') || contentLower.includes('plot') || 
      contentLower.includes('chart') || contentLower.includes('graph')) {
    return TASK_TYPES.VISUALIZATION.CHARTS;
  }

  // Check for code generation
  if (contentLower.includes('generate') || contentLower.includes('create')) {
    if (contentLower.includes('code')) return TASK_TYPES.GENERATION.CODE;
    if (contentLower.includes('report')) return TASK_TYPES.GENERATION.REPORT;
    if (contentLower.includes('sql')) return TASK_TYPES.GENERATION.SQL;
  }

  // Default to data analysis if no specific task is detected
  return TASK_TYPES.ANALYSIS.DATA;
}
