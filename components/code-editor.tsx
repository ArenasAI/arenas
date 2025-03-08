'use client';

import { EditorView } from '@codemirror/view';
import { EditorState, StateEffect } from '@codemirror/state';
import { Transaction } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup } from 'codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { Extension } from '@codemirror/state';
import React, { memo, useEffect, useRef, useMemo } from 'react';
import { Suggestion } from '@/lib/supabase/types';

type EditorProps = {
  content: string;
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
  status: 'streaming' | 'idle';
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  suggestions: Array<Suggestion>;
  language?: string;
};

// Create a custom remote annotation
const remoteAnnotation = StateEffect.define<boolean>();

// Helper to determine language based on file extension or content
function getLanguageExtension(language?: string): Extension {
  if (!language) return [];
  
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
    case 'jsx':
    case 'typescript':
    case 'ts':
    case 'tsx':
      return javascript();
    case 'python':
    case 'py':
      return python();
    default:
      // Default to Python if unknown
      return python();
  }
}

function PureCodeEditor({ content, onSaveContent, status, language }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);
  
  // Determine the language extension to use
  const languageExtension = useMemo(() => getLanguageExtension(language), [language]);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      try {
        const extensions = [basicSetup, languageExtension, oneDark];
        const startState = EditorState.create({
          doc: content,
          extensions,
        });

        editorRef.current = new EditorView({
          state: startState as any, // Type cast to avoid version mismatch errors
          parent: containerRef.current,
        });
      } catch (error) {
        console.error("Error creating editor:", error);
      }
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
    // NOTE: we only want to run this effect once when the component mounts
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      try {
        const updateListener = EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            // Check if any transaction has the remote annotation
            let isRemoteChange = false;
            for (const tr of update.transactions) {
              // Using a try-catch to handle potential version compatibility issues
              try {
                // Check for effects that might indicate a remote change
                const hasRemoteEffect = tr.effects.some(e => e.is(remoteAnnotation));
                if (hasRemoteEffect) {
                  isRemoteChange = true;
                  break;
                }
              } catch (e) {
                // Fallback for compatibility
                console.error("Error checking transaction:", e);
              }
            }

            if (!isRemoteChange) {
              const newContent = update.state.doc.toString();
              onSaveContent(newContent, true);
            }
          }
        });

        const extensions = [basicSetup, languageExtension, oneDark, updateListener];
        const newState = EditorState.create({
          doc: editorRef.current.state.doc,
          extensions,
        });

        // Type cast to avoid version mismatch errors
        editorRef.current.setState(newState as any);
      } catch (error) {
        console.error("Error updating editor state:", error);
      }
    }
  }, [onSaveContent, languageExtension]);

  useEffect(() => {
    if (editorRef.current && content) {
      try {
        const currentContent = editorRef.current.state.doc.toString();

        if (status === 'streaming' || currentContent !== content) {
          const transaction = editorRef.current.state.update({
            changes: {
              from: 0,
              to: currentContent.length,
              insert: content,
            },
            effects: [remoteAnnotation.of(true)]
          });

          editorRef.current.dispatch(transaction);
        }
      } catch (error) {
        console.error("Error updating content:", error);
      }
    }
  }, [content, status]);

  return (
    <div
      className="relative not-prose w-full pb-[calc(80dvh)] text-sm"
      ref={containerRef}
    />
  );
}

function areEqual(prevProps: EditorProps, nextProps: EditorProps) {
  if (prevProps.suggestions !== nextProps.suggestions) return false;
  if (prevProps.currentVersionIndex !== nextProps.currentVersionIndex)
    return false;
  if (prevProps.isCurrentVersion !== nextProps.isCurrentVersion) return false;
  if (prevProps.status === 'streaming' && nextProps.status === 'streaming')
    return false;
  if (prevProps.content !== nextProps.content) return false;
  if (prevProps.language !== nextProps.language) return false;

  return true;
}

export const CodeEditor = memo(PureCodeEditor, areEqual);
