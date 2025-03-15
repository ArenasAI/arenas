import { DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import { getDocumentById, getSession } from '@/lib/cached/cached-queries';
import { documentHandlersByArtifactKind } from '@/lib/artifacts/server';
import { User } from '@supabase/supabase-js';

interface UpdateDocumentProps {
  session: User;
  dataStream: DataStreamWriter;
  selectedModelId: string;
}

export const updateDocument = ({ session, dataStream, selectedModelId }: UpdateDocumentProps) =>
  tool({
    description: 'Update a document with the given description.',
    parameters: z.object({
      id: z.string().describe('The ID of the document to update'),
      description: z
        .string()
        .describe('The description of changes that need to be made'),
    }),
    execute: async ({ id, description }) => {
      const document = await getDocumentById(id);
      const user = await getSession();

      if (!user) {
        return new Response('Unauthorized', { status: 401 });
      }

      if (!document) {
        return {
          error: 'Document not found',
        };
      }

      dataStream.writeData({
        type: 'clear',
        content: document.title,
      });

      const documentHandler = documentHandlersByArtifactKind.find(
        (documentHandlerByArtifactKind) =>
          documentHandlerByArtifactKind.kind === document.kind,
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${document.kind}`);
      }

      await documentHandler.onUpdateDocument({
        document,
        description,
        dataStream,
        session,
        modelId: selectedModelId,
      });

      dataStream.writeData({ type: 'finish', content: '' });

      return {
        id,
        title: document.title,
        kind: document.kind,
        content: 'The document has been updated successfully.',
      };
    },
  });
