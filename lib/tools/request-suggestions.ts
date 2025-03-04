import { z } from 'zod';
import { DataStreamWriter, streamObject, tool } from 'ai';
import { getDocumentById } from '@/lib/cached/cached-queries';
import { saveSuggestions } from '@/lib/cached/mutations';
import { Database } from '../supabase/types';
import { generateUUID } from '@/lib/utils';
import { myProvider } from '@/ai/models';

type Suggestions = Database['public']['Tables']['suggestions']['Row']

interface RequestSuggestionsProps {
  session: any;
  dataStream: DataStreamWriter;
  selectedModelId: string;
}

export interface SuggestionInput {
  document_id: string;
  document_created_at: string;
  original_text: string;
  suggested_text: string;
  description?: string;
  user_id: string;
  is_resolved?: boolean;
}

export interface SuggestionResponse {
  id: string;
  document: {
    id: string;
    title: string;
    kind: string;
  };
  message: string;
}

export interface SuggestionWithMetadata extends Suggestions {
  visualizationData?: {
    type: 'chart' | 'graph' | 'table';
    data: any;
    config?: {
      title?: string;
      legend?: boolean;
      dimensions?: {
        width: number;
        height: number;
      };
      exportOptions?: {
        formats: ('png' | 'svg' | 'csv')[];
      };
    };
  };
}

export const requestSuggestions = ({
  session,
  dataStream,
  selectedModelId,
}: RequestSuggestionsProps) =>
  tool({
    description: 'Request suggestions for a document',
    parameters: z.object({
      documentId: z
        .string()
        .describe('The ID of the document to request edits'),
    }),
    execute: async ({ documentId }) => {
      const document = await getDocumentById(documentId);

      if (!document || !document.content) {
        return {
          error: 'Document not found',
        };
      }

      const suggestions: Array<Omit<Database['public']['Tables']['suggestions']['Insert'], 
        'created_at' | 'user_id' | 'document_created_at'>> = [];

      const { elementStream } = streamObject({
        model: myProvider.languageModel(selectedModelId),
        system:
          'You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.',
        prompt: document.content,
        output: 'array',
        schema: z.object({
          originalText: z.string().describe('The original text to be replaced'),
          suggestedText: z.string().describe('The suggested replacement text'),
          description: z.string().describe('The description of the suggestion'),
          document_created_at: z.string().optional().default(new Date().toISOString()),
        }),
      });

      for await (const element of elementStream) {
        const suggestion = {
          id: generateUUID(),
          document_id: documentId,
          document_created_at: element.document_created_at || new Date().toISOString(),
          original_text: element.originalText,
          suggested_text: element.suggestedText,
          description: element.description,
          is_resolved: false,
        };

        dataStream.writeData({
          type: 'suggestion',
          content: suggestion,
        });

        suggestions.push(suggestion);
      }

      if (session.user?.id) {
        const userId = session.user.id;

        await saveSuggestions({
          suggestions: suggestions.map((suggestion) => ({
            documentId: suggestion.document_id,
            documentCreatedAt: suggestion.document_created_at,
            originalText: suggestion.original_text,
            suggestedText: suggestion.suggested_text,
            description: suggestion.description || '',
            userId: userId,
            isResolved: suggestion.is_resolved || false,
          })),
        });
      }

      return {
        id: documentId,
        title: document.title,
        kind: document.kind,
        message: 'Suggestions have been added to the document',
      };
    },
  });