import {
  createDataStreamResponse,
  type Message,
  smoothStream,
  streamText,
} from 'ai';
import { getChatById, getSession } from '@/lib/cached/cached-queries';
import {
  saveChat,
  saveMessages,
  deleteChatById,
} from '@/lib/cached/mutations';
import {
  generateUUID,
  getMostRecentUserMessage,
  extractDocumentId,
  sanitizeUIMessages,
  sanitizeResponseMessages,
} from '@/lib/utils';
import type { FileAttachment } from '@/shared/chat';
import { NextResponse } from 'next/server';
import { generateTitleFromUserMessage } from '../../actions';
import { systemPrompt } from '@/ai/prompts';
import { MessageRole } from '@/lib/supabase/types';
import { queryDocumentContext } from '@/lib/pinecone';
import { myProvider } from '@/ai/models';
import { openai } from '@ai-sdk/openai';
export const maxDuration = 60;

type RequestBody = {
  id: string;
  messages: Array<Message>;
  modelId: string;
};

const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/pdf',
  'text/plain',
  'image/png',
  'image/jpeg',
];

function validateAttachment(attachment: FileAttachment) {
  if (!ALLOWED_MIME_TYPES.includes(attachment.mimeType)) {
    throw new Error(`Unsupported file format: ${attachment.mimeType}`);
  }
}

function contentToString(content: any): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('\n');
  }
  return JSON.stringify(content);
}

export async function POST(request: Request) {
    const { id, messages, modelId } : RequestBody = await request.json();

    if (!id || !modelId ) {
      return NextResponse.json({ error: 'Invalid id or modelId' }, { status: 400 });
    }
    const user = await getSession();

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userMessage = getMostRecentUserMessage(messages);    
    if (!userMessage) {
      return NextResponse.json({ error: 'No user message found' }, { status: 400 });
    }

    const chat = await getChatById(id);
    if (!chat) {
      const title = await generateTitleFromUserMessage({ message: userMessage, selectedModelId: modelId });
      await saveChat({ id, userId: user.id, title });
    }

    await saveMessages({
      chatId: id,
      messages: [
        {
          id: generateUUID(),
          chat_id: id,
          role: userMessage.role as MessageRole,
          content: userMessage.content,
          created_at: new Date().toISOString(),
        },
      ],
    });
    if (userMessage.content.includes('document:')) {
      const documentId = extractDocumentId(userMessage.content);
      if (!documentId) {
        return NextResponse.json({ error: 'No document ID found' }, { status: 400 });
      }
      
      const documentContext = await queryDocumentContext(
        userMessage.content,
        documentId,
        user.id,
        5
      );
      
      const contextPrompt = `
        Document context:
        ${documentContext.map(ctx => ctx.text).join('\n\n')}
        
        User query: ${userMessage.content}
        
        Based on the document context above, please respond to the user's query.
      `;
    }
    
    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(modelId),
          system: systemPrompt,
          messages,
          maxSteps: 5,
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          onFinish: async ({ response, reasoning }) => {
            if (user && user.id) {
              try {
                const responseMessagesWithoutIncompleteToolCalls = sanitizeResponseMessages({
                messages: response.messages,
                reasoning,
              });

            await saveMessages({
              chatId: id,
              messages: responseMessagesWithoutIncompleteToolCalls.map((message) => {
                return {
                    id: message.id,
                    chat_id: id,
                    role: message.role as MessageRole,
                    content: contentToString(message.content),
                    created_at: new Date().toISOString(),
                  };
                }
              ),
            });
              } catch (error) {
                console.error('Failed to save chat', error);
              }
            }
          },
          experimental_telemetry: {
            isEnabled: true,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: (error) => {
        console.error('Error in chat stream:', error);
        return 'Oops, an error occurred while processing your request!';
      },
    });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const user = await getSession();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById(id);

    if (!chat) {
      console.error(`Chat with ID ${id} not found`);
      return new Response('Chat not found', { status: 404 });
    }

    if (chat.user_id !== user.id!) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById(id, user.id);

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}