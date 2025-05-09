import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  value: string;
}

export function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  // Map common language names to ones supported by react-syntax-highlighter
  const normalizeLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'py': 'python',
      'rb': 'ruby',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'bash',
      'shell': 'bash',
      'json': 'json',
      'yml': 'yaml',
      'yaml': 'yaml',
      'html': 'html',
      'css': 'css',
      'php': 'php',
      'go': 'go',
      'rust': 'rust',
      'rs': 'rust',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'java': 'java',
      'kt': 'kotlin',
      'sql': 'sql',
      'md': 'markdown',
      'r': 'r',
      'jl': 'julia',
      '': 'text',
    };

    return languageMap[lang.toLowerCase()] || lang;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="relative rounded-md overflow-hidden my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 text-zinc-300">
        <span className="text-xs font-mono">{language}</span>
        <button
          onClick={copyToClipboard}
          className="text-zinc-400 hover:text-white p-1 rounded transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={normalizeLanguage(language)}
        customStyle={{
          margin: 0,
          borderRadius: '0 0 0.375rem 0.375rem',
        }}
        wrapLines={true}
        showLineNumbers={true}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
} 