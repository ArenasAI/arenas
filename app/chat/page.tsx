'use client';

import { useState } from 'react';
import RuntimeSelector from './components/RuntimeSelector';
import RuntimeStatus from './components/RuntimeStatus';
import VisualizationPanel from './components/VisualizationPanel';
import { processUserPrompt } from './ollama/ollama-service';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  code?: string;
  visualization?: string;
}

export default function Chat() {
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRuntime, setSelectedRuntime] = useState('python');
  const [code, setCode] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsProcessing(true);
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    
    try {
      // Process the prompt using our AI service
      const response = await processUserPrompt(message, selectedRuntime);
      
      // Add AI response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.message,
        code: response.code,
        visualization: response.visualization
      }]);

      // If there's code generated, update the code editor
      if (response.code) {
        setCode(response.code);
      }

    } catch (error) {
      console.error('Error processing prompt:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.'
      }]);
    } finally {
      setIsProcessing(false);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top bar with runtime controls */}
      <div className="fixed top-4 left-4 flex items-center space-x-4">
        <RuntimeSelector
          selectedRuntime={selectedRuntime}
          onRuntimeChange={setSelectedRuntime}
        />
        <RuntimeStatus isProcessing={isProcessing} />
      </div>

      {/* Chat messages area */}
      <div className="flex-1 overflow-auto px-4 py-2">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`mb-4 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div 
                  className={`inline-block p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
                {message.visualization && (
                  <VisualizationPanel output={message.visualization} />
                )}
              </div>
            ))}
          </div>

          {/* Input area */}
      <div className="w-full max-w-4xl mx-auto px-4 pb-6">
        <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask me anything about your data..."
            className="w-full p-4 pr-16 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                disabled={isProcessing}
              />
              <button
            type="submit"
            disabled={isProcessing}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-md ${
              isProcessing
                ? "bg-gray-100 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } transition-colors`}
          >
            <svg
              className={`w-5 h-5 ${isProcessing ? "text-gray-400" : "text-white"}`}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
    </div>
    </div>
  );
}