import {
  createDataStreamResponse,
  type Message,
  smoothStream,
  // convertToCoreMessages,
  CoreMessage,
  streamText,
  tool,
  ToolInvocation,
} from 'ai';
// import { Sandbox } from '@e2b/code-interpreter'
import { getChatById, getSession } from '@/lib/cached/cached-queries';
import { 
  saveChat,
  saveMessages,
  deleteChatById,
} from '@/lib/cached/mutations';
import { generateUUID, getMostRecentUserMessage, sanitizeResponseMessages } from '@/lib/utils';
import { NextResponse } from 'next/server';
import { generateTitleFromUserMessage } from '../../actions';
import { systemPrompt } from '@/ai/prompts';
import { MessageRole } from '@/lib/supabase/types';
import { myProvider } from '@/ai/models';
import { isProductionEnvironment } from '@/utils/constants';
import { z } from 'zod';
import { getContext } from '@/lib/rag/context';
// import { getModelById } from '@/ai/models';
// import { getUserSubscription } from '@/lib/stripe/client';
// import { checkMessageLimit } from '@/lib/stripe/client';
import { storeDocument } from '@/lib/rag/pinecone';
import CodeInterpreter from '@e2b/code-interpreter';
import { runVisualizationCode } from '@/lib/sandbox';

export const maxDuration = 60;

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
        if (content.type === 'tool-call') {
          return {
            type: 'tool-call',
            toolCallId: content.toolCallId,
            toolName: content.toolName,
            args: content.args,
          };
        }
        return content;
      })
    );
  }

  return '';
}

export async function POST(request: Request) {
    const { id, messages, modelId } = await request.json();
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add logging for incoming request
    console.log('Received request with messages:', messages.map((m: Message) => ({
      role: m.role,
      hasAttachments: !!m.experimental_attachments,
      attachmentCount: m.experimental_attachments?.length || 0
    })));

    //filter out incomplete tool invocations
    const filteredMessages = messages.filter((message: Message) => {
      if (!message.toolInvocations) return true;
      return message.toolInvocations.every(
        (invocation: ToolInvocation) => invocation.state === 'result' && invocation.result
      );
    });

    const userMessage = getMostRecentUserMessage(filteredMessages);

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
      messages: [{
        id: generateUUID(),
        chat_id: id,
        role: userMessage.role as MessageRole,
        content: userMessage.content,
        created_at: new Date().toISOString(),
      }],
    });

    // Get context from RAG if there are spreadsheet/large files
    let documentContext = '';
    let fileRef = '';
    if (userMessage.experimental_attachments && userMessage.experimental_attachments.length > 0) {
      const attachment = userMessage.experimental_attachments[0];
      console.log('Processing attachment:', {
        contentType: attachment.contentType,
        url: attachment.url,
        name: attachment.name
      });

      const isTextBased = attachment.contentType?.includes('text') || 
                          attachment.contentType?.includes('spreadsheet') ||
                          attachment.contentType?.includes('csv') ||
                          attachment.contentType?.includes('excel') ||
                          attachment.contentType?.includes('pdf');
      
      if (attachment.contentType?.startsWith('image/')) {
        console.log('Processing image attachment');
        const imageContent = `Here's an image: <image>${attachment.url}</image>\n${userMessage.content}`;
        userMessage.content = imageContent;
      } else if (isTextBased) {
        try {
          console.log('Processing text-based attachment');
          fileRef = attachment.url.split('/').pop() || '';
          
          // First get the file content
          console.log('Fetching file content from:', attachment.url);
          const response = await fetch(attachment.url);
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
          }
          const fileBuffer = await response.arrayBuffer();
          console.log('File fetched successfully, size:', fileBuffer.byteLength);
          
          // Convert buffer to string for text-based files
          const fileContent = new TextDecoder().decode(fileBuffer);
          
          // Store and index the document in Pinecone
          console.log('Storing document in Pinecone');
          await storeDocument(
              fileBuffer,
              fileRef,
              attachment.contentType || '',
              user.id,
              fileRef
          );
          console.log('Document stored in Pinecone successfully');
          
          // Get context based on user's query
          console.log('Retrieving context from Pinecone');
          documentContext = await getContext(userMessage.content, fileRef);
          console.log('Context retrieved, length:', documentContext.length);
          
          // For spreadsheet files, add specific instructions
          const isSpreadsheet = attachment.contentType?.includes('spreadsheet') || 
                              attachment.contentType?.includes('csv') ||
                              attachment.contentType?.includes('excel');
          
          if (isSpreadsheet) {
            // Add spreadsheet-specific context
            const enhancedPrompt = `
              I have a spreadsheet file named "${fileRef}" with the following content:
              ${fileContent}
              
              Please analyze this data and answer the following question: ${userMessage.content}
              
              If you need to perform any data analysis, please use the appropriate tools (data_analysis, clean_data, or visualization) to help answer the question.
            `;
            
            userMessage.content = enhancedPrompt;
          } else {
            // For other text-based files
            const enhancedPrompt = `
              Context from the document:
              ${documentContext}
              
              User question: ${userMessage.content}
              
              Please answer based on the context provided above.
            `;
            
            userMessage.content = enhancedPrompt;
          }
          
          userMessage.experimental_attachments = [];
        } catch (error) {
          console.error('Error processing attachment:', error);
          return NextResponse.json({ 
            error: 'Failed to process attachment',
            details: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      } else {
        console.log('Unsupported attachment type:', attachment.contentType);
        return NextResponse.json({ 
          error: 'Unsupported file type',
          contentType: attachment.contentType
        }, { status: 400 });
      }
    }

    const recentMessages = filteredMessages.slice(-5);

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(modelId),
          messages: recentMessages,
          maxSteps: 5,
          system: systemPrompt,
          tools: {
            code: tool({
              description: "analyze data, added in one tool call",
              parameters: z.object({
                code: z.string().describe("The code to execute"),
                fileRef: z.string().optional().describe("The file reference to the data to analyze. If not provided, will use sample data."),
                language: z.enum(["python", "r", "julia"]).default("python")
              }),
              execute: async ({ code: codeToExecute }) => {
                const sandbox = await CodeInterpreter.create(process.env.SANDBOX_TEMPLATE_ID!);
                let message = '';

                try {
                  const execution = await sandbox.runCode(codeToExecute);

                  if (execution.error) {
                    console.log('Error executing code:', execution.error);
                    message += `Error executing code:\n${execution.error.toString()}`;
                  }

                  return {
                    message: message,
                    output: execution.results
                  }
                } catch (error) {
                  console.error('Error executing code:', error);
                }
              }
            }),
            visualization: tool({
              description: "Generate visualizations from code execution results",
              parameters: z.object({
                code: z.string().describe("The code to execute"),
                fileRef: z.string().optional().describe("The file reference to the data to analyze. If not provided, will use sample data."),
                language: z.enum(["python", "r", "julia"]).default("python"),
                title: z.string().default('Data Visualization')
              }),
              execute: async ({ code }) => {
                const sandbox = await CodeInterpreter.create(process.env.SANDBOX_TEMPLATE_ID!);
                const execution = await runVisualizationCode(sandbox, code);

                return {
                  message: 'Visualization generated successfully',
                  output: execution
                }
              }
            }),
          },

          experimental_transform: smoothStream({ chunking: 'word', delayInMs: 15 }),
          experimental_generateMessageId: generateUUID,
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
