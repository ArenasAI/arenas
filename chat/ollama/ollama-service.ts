import { useState } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface OllamaResponse {
  response: string;
  model: string;
}

export const useOllamaChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (message: string, model: string = 'llama2') => {
    try {
      setIsLoading(true);
      setError(null);

      // Add user message to chat
      setMessages(prev => [...prev, { role: 'user', content: message }]);

      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          model,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from LLM');
      }

      const data: OllamaResponse = await response.json();

      // Add assistant response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setError(null);
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
};
