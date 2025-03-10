import {
  createDataStreamResponse,
  type Message,
  smoothStream,
  convertToCoreMessages,
  CoreMessage,
  streamText,
  tool,
} from 'ai';
import { getChatById, getSession } from '@/lib/cached/cached-queries';
import {
  saveChat,
  saveMessages,
  deleteChatById,
} from '@/lib/cached/mutations';
import CodeInterpreter, { type Result } from '@e2b/code-interpreter';
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
import { z } from 'zod';
import { createDocument } from '@/lib/tools/create-document';
import { updateDocument } from '@/lib/tools/update-document';

export const maxDuration = 60;

type RequestBody = {
  id: string;
  messages: Array<Message>;
  experimental_attachments?: Array<{
    name: string;
    url: string;
    contentType: string;
  }>;
  modelId: string;
};

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
    const { id, messages, modelId, experimental_attachments } : RequestBody = await request.json();
    const user = await getSession();

    const filteredMessages = messages.map((message) => {
      if (message.toolInvocations) {
        return {
          ...message,
          toolInvocations: undefined,
        };
      }
      return message;
    });
        
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    const userMessage = getMostRecentUserMessage(messages);
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
          content: userMessage.content,
          created_at: new Date().toISOString(),
        },
      ],
    });

    return createDataStreamResponse({
      execute: (dataStream) => {

        const result = streamText({
          model: myProvider.languageModel(modelId),
          messages: convertToCoreMessages(filteredMessages),
          maxSteps: 5,
          system: systemPrompt,
          tools: {
            visualization: tool({
              description: 'Create visualizations from CSV or Excel files. If no file is attached, uses sample data.',
              parameters: z.object({
                type: z.enum(['histogram', 'boxplot', 'scatter', 'line', 'bar']),
                columns: z.array(z.string()),
                title: z.string().optional()
              }),
              execute: async ({ type, columns, title }) => {
                console.log('creating visualization...');
                const sandbox = await CodeInterpreter.create({
                  apiKey: process.env.E2B_API_KEY,
                });

                const code = `
                  import pandas as pd
                  import matplotlib.pyplot as plt
                  import seaborn as sns
                  
                  # Create or read data
                  ${!experimental_attachments?.[0] ? `
                  # Using sample data
                  data = {
                    'Month': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    'Value': [10, 15, 13, 17, 21, 19],
                    'Category': ['A', 'A', 'B', 'B', 'C', 'C'],
                    'Count': [100, 150, 130, 170, 210, 190]
                  }
                  df = pd.DataFrame(data)
                  ` : `
                  # Read the uploaded file
                  df = pd.read_csv("${experimental_attachments[0].url}")
                  `}
                  
                  # Create the plot
                  plt.figure(figsize=(10, 6))
                  ${type === 'histogram' ? `
                    for col in ${JSON.stringify(columns)}:
                        if col in df.columns:
                            sns.histplot(data=df, x=col)
                        else:
                            print(f"Column {col} not found. Available columns: {list(df.columns)}")
                  ` : type === 'boxplot' ? `
                    if ${JSON.stringify(columns[0])} in df.columns:
                        sns.boxplot(data=df, y=${JSON.stringify(columns[0])})
                    else:
                        print(f"Column {${JSON.stringify(columns[0])}} not found. Available columns: {list(df.columns)}")
                  ` : type === 'scatter' ? `
                    if all(col in df.columns for col in ${JSON.stringify(columns.slice(0, 2))}):
                        sns.scatterplot(data=df, x=${JSON.stringify(columns[0])}, y=${JSON.stringify(columns[1])})
                    else:
                        print(f"One or more columns not found. Available columns: {list(df.columns)}")
                  ` : type === 'line' ? `
                    if all(col in df.columns for col in ${JSON.stringify(columns.slice(0, 2))}):
                        sns.lineplot(data=df, x=${JSON.stringify(columns[0])}, y=${JSON.stringify(columns[1])})
                    else:
                        print(f"One or more columns not found. Available columns: {list(df.columns)}")
                  ` : `
                    if all(col in df.columns for col in ${JSON.stringify(columns.slice(0, 2))}):
                        sns.barplot(data=df, x=${JSON.stringify(columns[0])}, y=${JSON.stringify(columns[1])})
                    else:
                        print(f"One or more columns not found. Available columns: {list(df.columns)}")
                  `}
                  
                  plt.title(${JSON.stringify(title || 'Data Visualization')})
                  plt.tight_layout()
                  plt.savefig('plot.png')
                  
                  # Print available columns for reference
                  print("\\nAvailable columns:", list(df.columns))
                `;

                const result = await sandbox.runCode(code);
                
                return {
                  type: 'visualization',
                  content: {
                    text: result.text || '',
                    image: result.results?.[0]?.data
                  }
                };
              },
            }),
            reports: tool({
              description: 'Generate data analysis reports from CSV or Excel files. If no file is attached, uses sample data.',
              parameters: z.object({
                type: z.enum(['summary', 'detailed']),
                columns: z.array(z.string()).optional()
              }),
              execute: async ({ type, columns }) => {
                console.log('generating report...');
                const sandbox = await CodeInterpreter.create({
                  apiKey: process.env.E2B_API_KEY,
                });

                const code = `
                  import pandas as pd
                  import numpy as np
                  ${type === 'detailed' ? 'from scipy import stats' : ''}
                  
                  # Create or read data
                  ${!experimental_attachments?.[0] ? `
                  # Using sample data
                  data = {
                    'Month': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    'Value': [10, 15, 13, 17, 21, 19],
                    'Category': ['A', 'A', 'B', 'B', 'C', 'C'],
                    'Count': [100, 150, 130, 170, 210, 190]
                  }
                  df = pd.DataFrame(data)
                  print("Using sample data since no file was attached.\\n")
                  ` : `
                  # Read the uploaded file
                  df = pd.read_csv("${experimental_attachments[0].url}")
                  `}
                  
                  ${type === 'summary' ? `
                  # Basic statistics
                  summary = {
                      'total_rows': len(df),
                      'columns': list(df.columns),
                      'numeric_stats': df.describe().to_dict(),
                      'missing_values': df.isnull().sum().to_dict(),
                  }
                  
                  # Column-specific analysis
                  cols = ${columns ? JSON.stringify(columns) : 'df.columns'}
                  for col in cols:
                      if col in df.columns and df[col].dtype in ['int64', 'float64']:
                          summary[f'{col}_outliers'] = len(df[df[col] > df[col].mean() + 2*df[col].std()])
                      elif col not in df.columns:
                          print(f"Column {col} not found in the data.")
                  
                  print(summary)
                  ` : `
                  cols = ${columns ? JSON.stringify(columns) : 'df.columns'}
                  available_cols = [col for col in cols if col in df.columns]
                  if not available_cols:
                      print("None of the specified columns were found in the data.")
                      print("Available columns:", list(df.columns))
                  else:
                      analysis = {
                          'basic_stats': df[available_cols].describe().to_dict(),
                          'correlations': df[available_cols].corr().to_dict(),
                          'value_counts': {col: df[col].value_counts().to_dict() for col in available_cols},
                          'distributions': {
                              col: {
                                  'skewness': float(stats.skew(df[col].dropna())) if df[col].dtype in ['int64', 'float64'] else None,
                                  'kurtosis': float(stats.kurtosis(df[col].dropna())) if df[col].dtype in ['int64', 'float64'] else None
                              } for col in available_cols
                          }
                      }
                      print(analysis)
                  `}
                  
                  # Print available columns for reference
                  print("\\nAvailable columns:", list(df.columns))
                `;

                const result = await sandbox.runCode(code);
                
                return {
                  type: 'report',
                  content: {
                    text: result.text || '',
                    type
                  }
                };
              },
            }),
            createDocument: createDocument({session: user, dataStream, selectedModelId: modelId}),
            updateDocument: updateDocument({session: user, dataStream, selectedModelId: modelId}),
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