import {
  createDataStreamResponse,
  type Message,
  type CoreMessage,
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
  sanitizeResponseMessages,
} from '@/lib/utils';
import { NextResponse } from 'next/server';
import { generateTitleFromUserMessage } from '../../actions';
import { systemPrompt } from '@/ai/prompts';
import { MessageRole } from '@/lib/supabase/types';
import { myProvider } from '@/ai/models';
import { createDocument } from '@/lib/tools/create-document';
import { updateDocument } from '@/lib/tools/update-document';
import { generateVisualization } from '@/lib/tools/generate-visualization';
import { isProductionEnvironment } from '@/utils/constants';
import { cleanData } from '@/lib/tools/data-cleaning';
import { generateReports } from '@/lib/tools/generate-reports';

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

export async function POST(request: Request) {
    const { id, messages, modelId } : RequestBody = await request.json();
    const user = await getSession();
    const session = await getSession();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Process messages to handle attachments
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
      const title = await generateTitleFromUserMessage({ message: userMessage, selectedModelId: modelId });
      await saveChat({ id, userId: user.id, title });
    }

    // Save the message with file data preserved
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
 
          const cleanDataTool = {
            handler: cleanData({ session, dataStream, selectedModelId: modelId }),
            description: "Clean and transform data",
            parameters: {
              type: "object",
              properties: {
                data: { type: "array" },
                language: { type: "string", enum: ["python", "r", "julia"] },
                operations: { type: "array", items: { type: "string" } }
              },
              required: ["data"]
            }
          };

          const generateReportsTool = {
            handler: generateReports({ session, dataStream, selectedModelId: modelId }),
            description: "Generate reports from data",
            parameters: {
              type: "object",
              properties: {
                data: { type: "array" },
                language: { type: "string", enum: ["python", "r", "julia"] },
                reportType: { type: "string", enum: ["summary", "detailed", "visualization"] },
                columns: { type: "array", items: { type: "string" } }
              },
              required: ["data"]
            }
          };

        const result = streamText({
          model: myProvider.languageModel(modelId),
          system: systemPrompt,
          messages: processedMessages,
          maxSteps: 5,
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          // tools: {
          //   createDocument: createDocument({ session, dataStream, selectedModelId: modelId }),
          //   updateDocument: updateDocument({ session, dataStream, selectedModelId: modelId }),
          //   generateVisualization: generateVisualization({ session, dataStream, selectedModelId: modelId }),
          //   generateReports: generateReportsTool,
          //   cleanData: cleanDataTool,
          // },
          onFinish: async ({ response, reasoning }) => {
            if (user && user.id) {
              try {
                await saveMessages({
                  chatId: id,
                  messages: response.messages.map((message) => {
                     // Transform content to match Message['content']
                    const content = typeof message.content === 'string'
                      ? message.content // AssistantContent as string
                      : JSON.stringify(message.content); // ToolContent (array) to string
                
                    return {
                      id: message.id ?? generateUUID(), // Handle undefined
                      chat_id: id,
                      role: message.role as MessageRole, // Assuming MessageRole matches SDK roles
                      content, // Now string | Record<string, unknown>
                      created_at: new Date().toISOString(),
                    };
                  }),
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