// components/AIAnalysis.tsx
import { useState } from 'react';
import { useAI } from '../hooks/useAI';

const AI_MODELS = [
  { id: 'llama', name: 'Llama 3.3' },
  { id: 'vertex', name: 'Google Vertex' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'groq', name: 'Groq' },
  { id: 'arenas', name: 'Arenas (Custom)' }
];

export const AIAnalysis = () => {
  const { analyzeData, loading, error } = useAI();
  const [selectedModel, setSelectedModel] = useState('arenas');
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleAnalysis = async () => {
    try {
      const response = await analyzeData([{ content: input }], selectedModel);
      setResult(response.result);
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Select AI Model
        </label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full p-2 border rounded"
        >
          {AI_MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Input Text
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-2 border rounded"
          rows={4}
        />
      </div>

      <button
        onClick={handleAnalysis}
        disabled={loading || !input}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>

      {error && (
        <div className="text-red-500">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 border rounded">
          <h3 className="font-medium mb-2">Analysis Result:</h3>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
