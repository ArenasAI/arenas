import {
  createDataStreamResponse,
  type Message,
  smoothStream,
  convertToCoreMessages,
  CoreMessage,
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
  sanitizeResponseMessages,
} from '@/lib/utils';
import { NextResponse } from 'next/server';
import { generateTitleFromUserMessage } from '../../actions';
import { systemPrompt } from '@/ai/prompts';
import { MessageRole } from '@/lib/supabase/types';
import { myProvider } from '@/ai/models';
import { isProductionEnvironment } from '@/utils/constants';

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

function formatMessageContent(message: CoreMessage): string {
  // For user messages, store as plain text
  if (message.role === 'user') {
    return typeof message.content === 'string'
      ? message.content
      : JSON.stringify(message.content);
  }

  // For tool messages, format as array of tool results
  if (message.role === 'tool') {
    return JSON.stringify(
      message.content.map((content) => ({
        type: content.type || 'tool-result',
        toolCallId: content.toolCallId,
        toolName: content.toolName,
        result: content.result,
      }))
    );
  }

  // For assistant messages, format as array of text and tool calls
  if (message.role === 'assistant') {
    if (typeof message.content === 'string') {
      return JSON.stringify([{ type: 'text', text: message.content }]);
    }

    return JSON.stringify(
      message.content.map((content) => {
        if (content.type === 'text') {
          return {
            type: 'text',
            text: content.text,
          };
        }
        return {
          type: 'tool-call',
          toolCallId: content.toolCallId,
          toolName: content.toolName,
          args: content.args,
        };
      })
    );
  }

  return '';
}

export async function POST(request: Request) {
    const { id, messages, modelId } : RequestBody = await request.json();
    const user = await getSession();
    const session = await getSession();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const processedMessages = messages.map(msg => {
      if (Array.isArray(msg.content)) {
        const content = msg.content.map(part => {
          if ('file' in part) {
            return {
              type: 'file',
              file: {
                ...part.file,
                contentType: ALLOWED_MIME_TYPES.includes(part.file.type) 
                  ? part.file.type 
                  : 'application/octet-stream'
              }
            };
          }
          return part;
        });
        
        return {
          id: msg.id,
          role: msg.role,
          content: JSON.stringify(content)
        } as Message;
      }
      return msg;
    });

    const userMessage = getMostRecentUserMessage(processedMessages);
    if (!userMessage) {
      return NextResponse.json({ error: 'No user message found' }, { status: 400 });
    }

    const chat = await getChatById(id);
    if (!chat) {
      const title = await generateTitleFromUserMessage({ message: userMessage });
      await saveChat({ id, userId: user.id, title });
    }

    await saveMessages({
      chatId: id,
      messages: [
        {
          id: generateUUID(),
          chat_id: id,
          role: userMessage.role as MessageRole,
          content: Array.isArray(userMessage.content) 
            ? JSON.stringify(userMessage.content)
            : userMessage.content,
          created_at: new Date().toISOString(),
        },
      ],
    });

    return createDataStreamResponse({
      execute: (dataStream) => {

        const result = streamText({
          model: myProvider.languageModel(modelId),
          messages,
          maxSteps: 5,
          temperature: 1,
          system: systemPrompt,
          experimental_transform: smoothStream({ chunking: 'word', delayInMs: 15 }),
          experimental_generateMessageId: generateUUID,
          onChunk: (event) => {
            if (event.chunk.type === 'tool-call'){
              console.log('Called tool:', event.chunk.toolCallId);
            }
          },
          onFinish: async ({ response, reasoning }) => {
            if (user && user.id) {
              try {
                const sanitizedResponseMessages = sanitizeResponseMessages({
                  messages: response.messages,
                  reasoning,
                });

                await saveMessages({
                  chatId: id,
                  messages: sanitizedResponseMessages.map((message) => ({
                    id: message.id ?? generateUUID(),
                    chat_id: id,
                    role: message.role as MessageRole,
                    content: formatMessageContent(message),
                    created_at: new Date().toISOString(),
                  })),
                });

              } catch (error) {
                console.error('Error processing response messages:', error);
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
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