import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { getOllamaResponse, isOllamaAvailable } from './ollama-service';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Initialize the clients with error handling
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;
const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

// Fallback response function
function getFallbackResponse(prompt) {
  return {
    content: "I apologize, but I'm currently operating in fallback mode. " +
      "Please ensure Ollama is running locally or configure API keys for cloud services.",
    source: "fallback"
  };
}

export async function getGPTResponse(prompt) {
  if (!openai) {
    console.warn('OpenAI API key not configured, using fallback');
    return getFallbackResponse(prompt);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return {
      content: response.choices[0].message.content,
      source: "gpt"
    };
  } catch (error) {
    console.error('GPT Error:', error.message);
    
    if (error.code === 'insufficient_quota' || error.status === 429) {
      console.warn('OpenAI quota/rate limit exceeded, falling back to alternative processing');
      return getFallbackResponse(prompt);
    }

    throw new Error(`GPT Error: ${error.message}`);
  }
}

export async function getClaudeResponse(prompt) {
  if (!anthropic) {
    console.warn('Claude API key not configured, falling back to GPT');
    return getGPTResponse(prompt);
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-instant-1.2",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    });

    return {
      content: response.content[0].text,
      source: "claude"
    };
  } catch (error) {
    console.error('Claude Error:', error.message);
    
    if (error.message?.includes('credit balance is too low')) {
      console.warn('Claude credits exhausted, falling back to GPT');
      return getGPTResponse(prompt);
    }

    console.warn('Claude error, attempting GPT fallback');
    return getGPTResponse(prompt);
  }
}

export async function getAIResponse(prompt, model = 'ollama') {
  try {
    // Try Ollama first if it's the requested model and is available
    if (model === 'ollama' && await isOllamaAvailable()) {
      return await getOllamaResponse(prompt);
    }
    
    // Fallback chain: Claude -> GPT -> Fallback
    if (model === 'claude') {
      return await getClaudeResponse(prompt);
    } else if (model === 'gpt') {
      return await getGPTResponse(prompt);
  }
    
    // If no valid model is available, return fallback
    return getFallbackResponse(prompt);
  } catch (error) {
    console.error('AI Service Error:', error);
    return getFallbackResponse(prompt);
}
}