'use client';

import { useState } from 'react';
import CodeEditor from './components/CodeEditor';
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

export default function ChatPage() {
  const [selectedRuntime, setSelectedRuntime] = useState('python');
  const [code, setCode] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUserPrompt = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    
    try {
      // Process the prompt using our AI service
      const response = await processUserPrompt(input, selectedRuntime);
      
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
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-none p-4 border-b">
        <RuntimeSelector
          selectedRuntime={selectedRuntime}
          onRuntimeChange={setSelectedRuntime}
        />
        <RuntimeStatus isProcessing={isProcessing} />
      </div>

      <div className="flex-grow flex">
        {/* Left panel: Code Editor */}
        <div className="w-1/2 border-r">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={selectedRuntime}
          />
        </div>

        {/* Right panel: Chat and Visualization */}
        <div className="w-1/2 flex flex-col">
          <div className="flex-grow p-4 bg-gray-50 overflow-auto">
            {/* Chat messages */}
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
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUserPrompt()}
                className="flex-grow p-2 border rounded"
                placeholder="Ask me to analyze data, create visualizations, or answer questions..."
                disabled={isProcessing}
              />
              <button
                className={`px-4 py-2 rounded text-white ${
                  isProcessing 
                    ? 'bg-gray-400' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                onClick={handleUserPrompt}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
