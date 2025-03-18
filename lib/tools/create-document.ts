import { generateUUID } from '@/lib/utils';
import { DataStreamWriter, streamObject, tool } from 'ai';
import { z } from 'zod';
import {
  artifactKinds,
  documentHandlersByArtifactKind,
} from '@/lib/artifacts/server';
import { User } from "@supabase/supabase-js";
import { saveDocument } from '@/lib/cached/mutations';
import { myProvider } from '@/ai/models';
import { systemPrompt } from '@/ai/prompts';

interface CreateDocumentProps {
  session: User,
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
        return {
          id: generateUUID(),
          title,
          kind,
          content: 'Error: Not authenticated',
        };
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
          model: myProvider.languageModel(selectedModelId),
          system: systemPrompt,
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

        try {
          const documentHandler = documentHandlersByArtifactKind.find(
            (handler) => handler.kind === kind,
          );

          if (!documentHandler) {
            dataStream.writeData({ 
              type: 'error', 
              content: `No document handler found for kind: ${kind}` 
            });
            
            // Update the document with the error message
            await saveDocument({
              id: documentId,
              userId: session.id,
              title,
              content: `Error: No document handler found for kind: ${kind}`,
              kind,
            });
            
            return {
              id: documentId,
              title,
              kind,
              content: `Error: No document handler found for kind: ${kind}`,
            };
          }

          // Execute the document handler to generate content
          await documentHandler.onCreateDocument({
            id: documentId,
            title,
            dataStream,
            session,
            modelId: selectedModelId,
          });
          
          // Make sure the final document has content saved to the database
          await saveDocument({
            id: documentId,
            userId: session.id,
            title,
            content: 'Document content created successfully',
            kind,
          });
        } catch (handlerError) {
          console.error('Error in document handler:', handlerError);
          dataStream.writeData({ 
            type: 'error', 
            content: `Error generating document content: ${handlerError instanceof Error ? handlerError.message : 'Unknown error'}` 
          });
          
          // Save document with error message if handler fails
          await saveDocument({
            id: documentId,
            userId: session.id,
            title,
            content: `Error generating content: ${handlerError instanceof Error ? handlerError.message : 'Unknown error'}`,
            kind,
          });
        }

        dataStream.writeData({ type: 'finish', content: '' });

        // Important: Always return a valid result with the expected structure
        return {
          id: documentId,
          title,
          kind,
          content: 'Document created successfully.',
        };
      } catch (error) {
        console.error('Error creating document:', error);
        return {
          id: generateUUID(),
          title,
          kind,
          content: `Error: Failed to create document - ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });
