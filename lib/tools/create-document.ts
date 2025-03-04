import { generateUUID } from '@/lib/utils';
import { DataStreamWriter, streamObject, tool } from 'ai';
import { z } from 'zod';
import { getSession } from '../cached/cached-queries';
import {
  artifactKinds,
  documentHandlersByArtifactKind,
} from '@/lib/artifacts/server';
import { Session } from '@supabase/supabase-js';
import { saveDocument } from '@/lib/cached/mutations';
import { myProvider } from '@/ai/models';
import { sheetPrompt } from '@/ai/prompts';

interface CreateDocumentProps {
  session: any,
  dataStream: DataStreamWriter,
  selectedModelId: string;
}

export const createDocument = ({ session, dataStream, selectedModelId }: CreateDocumentProps) =>
  tool({
    description:
      'Create a document for a writing or content creation activities. This tool will call other functions that will generate the contents of the document based on the title and kind.',
    parameters: z.object({
      title: z.string(),
      kind: z.enum(artifactKinds),
    }),
    execute: async ({ title, kind }) => {
      if (!session || !session.id) {
        return { success: false, error: 'Not authenticated' };
      }

      try {
        const documentId = generateUUID();
        
        await saveDocument({
          id: documentId,
          userId: session.id,
          title,
          content: '',
          kind,
        });

        const { fullStream } = streamObject({
          model: myProvider.languageModel(selectedModelId || 'gpt-4o'),
          system: sheetPrompt,
          prompt: title,
          schema: z.object({
            csv: z.string().describe('CSV data'),
          }),
        });

        dataStream.writeData({
          type: 'kind',
          content: kind,
        });

        dataStream.writeData({
          type: 'id',
          content: documentId,
        });

        dataStream.writeData({
          type: 'title',
          content: title,
        });

        dataStream.writeData({
          type: 'clear',
          content: '',
        });

        const documentHandler = documentHandlersByArtifactKind.find(
          (documentHandlerByArtifactKind) =>
            documentHandlerByArtifactKind.kind === kind,
        );

        if (!documentHandler) {
          throw new Error(`No document handler found for kind: ${kind}`);
        }

        await documentHandler.onCreateDocument({
          id: documentId,
          title,
          dataStream,
          session,
        });

        dataStream.writeData({ type: 'finish', content: '' });

        return {
          success: true,
          documentId,
          title,
          kind,
          content: 'A document was created and is now visible to the user.',
        };
      } catch (error) {
        console.error('Error creating document:', error);
        return { success: false, error: 'Failed to create document' };
      }
    },
  });
