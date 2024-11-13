"use client";

import { useState } from 'react';
import Footer from "../components/footer";
import ModelSelector from "../components/ModelSelector";

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('llama2');

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `Error: ${res.status}`);
      }
      
      setResponse(data.response);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Failed to get response. Please ensure Ollama is running.');
      setResponse('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-5">
      <h1 className="head_text text-3xl text-center">Arenas</h1>
      
      <div className="w-full max-w-2xl mt-8">
        <ModelSelector 
          selectedModel={selectedModel} 
          onModelSelect={setSelectedModel}
        />
        
        <textarea
          className="w-full h-20 p-4 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
          placeholder="Ask a question or provide data for analysis..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
        />
        
        {error && (
          <div className="mt-2 text-red-500 text-sm">
            {error}
          </div>
        )}
        
        <button 
          className={`mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Submit'}
        </button>

        {response && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h2 className="font-bold mb-2">Response:</h2>
            <p className="whitespace-pre-wrap">{response}</p>
    </div>
        )}
      </div>

      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <Footer />
      </footer>
    </div>
  );
}
