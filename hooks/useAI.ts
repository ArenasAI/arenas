import { useState } from 'react';
import { aiService } from '../services/ai-service';

export const useAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeData = async (
    messages: any[], 
    model?: string, 
    forceRefresh?: boolean
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await aiService.analyzeData({
        messages,
        model,
        forceRefresh
      });
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    analyzeData,
    loading,
    error
  };
};