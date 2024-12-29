import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

export function ChatConnector() {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleChat = async (prompt: string, model: string = 'mistral') => {
    try {
      setLoading(true);
      const result = await apiClient.chat('mistral', {
        model,
        prompt,
      });
      setResponse(result.data);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    handleChat,
    response,
    loading,
  };
}
