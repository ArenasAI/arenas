"use client";

import { useState, useEffect } from 'react';
import { listOllamaModels } from '@/lib/ollama-service';

export default function ModelSelector({ onModelSelect, selectedModel }) {
  const [availableModels, setAvailableModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchModels() {
      try {
        const models = await listOllamaModels();
        setAvailableModels(models);
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchModels();
  }, []);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Select Model:</label>
      <div className="flex gap-2 flex-wrap">
        {loading ? (
          <span className="text-sm text-gray-500">Loading models...</span>
        ) : availableModels.length > 0 ? (
          availableModels.map((model) => (
            <button
              key={model.name}
              className={`px-3 py-1 rounded-lg text-sm ${
                selectedModel === model.name
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => onModelSelect(model.name)}
            >
              {model.name}
            </button>
          ))
        ) : (
          <span className="text-sm text-red-500">
            No local models found. Please ensure Ollama is running.
          </span>
        )}
      </div>
    </div>
  );
}
