import {
  createDataStreamResponse,
  type Message,
  smoothStream,
  convertToCoreMessages,
  CoreMessage,
  streamText,
  tool,
  ToolInvocation,
} from 'ai';
import fs from 'fs';
import { Sandbox } from '@e2b/code-interpreter'
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
import { getModelById } from '@/ai/models';
import { getUserSubscription } from '@/lib/stripe/client';
import { checkMessageLimit } from '@/lib/stripe/client';
import { createSandbox } from '@/lib/sandbox';
import { runVisualizationCode } from '@/lib/sandbox';
import { storeDocument } from '@/lib/rag/pinecone';

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
    const { id, messages, modelId } = await request.json();
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if model requires pro
    const model = getModelById(modelId);
    if (model?.requiresPro) {
      const subscription = await getUserSubscription(user.id);
      if (subscription?.status !== 'active') {
        return NextResponse.json({ 
          error: `${model.label} is only available with Pro subscription`, 
          requiresUpgrade: true,
          upgradeMessage: `Upgrade to Pro to use ${model.label} and get unlimited messages`,
          modelName: model.label
        }, { status: 403 });
      }
    }

    const { canSendMessage, remainingMessages } = await checkMessageLimit(user.id);
    if (!canSendMessage) {
      return NextResponse.json({ 
        error: 'Message limit reached. Upgrade to Pro for unlimited messages', 
        requiresUpgrade: true,
        remainingMessages
      }, { status: 403 });
    }

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

    await saveMessages({
      chatId: id,
      messages: [{
        id: generateUUID(),
        chat_id: id,
        role: userMessage.role as MessageRole,
        content: userMessage.content,
        created_at: new Date().toISOString(),
      }],
      attachment_url: userMessage.experimental_attachments?.[0]?.url || '',
    });

    const chat = await getChatById(id);
    if (!chat) {
      const title = await generateTitleFromUserMessage({ message: userMessage });
      await saveChat({ id, userId: user.id, title });
    }

    // Get context from RAG if there are spreadsheet/large files
    let documentContext = '';
    let fileRef = '';
    if (userMessage.experimental_attachments?.length) {
      const attachment = userMessage.experimental_attachments[0];
      const isSpreadsheet = attachment.contentType?.includes('spreadsheet') || 
                           attachment.contentType?.includes('csv') ||
                           attachment.contentType?.includes('excel');
      
      if (attachment.contentType?.startsWith('image/')) {
        const imageContent = `Here's an image: <image>${attachment.url}</image>\n${userMessage.content}`;
        userMessage.content = imageContent;
      } else if (isSpreadsheet) {
        fileRef = attachment.url.split('/').pop() || '';
        
        // First get the file content
        const response = await fetch(attachment.url);
        const fileBuffer = await response.arrayBuffer();
        
        // Store and index the document in Pinecone first
        await storeDocument(
            fileBuffer,
            fileRef,
            attachment.contentType || '',
            user.id,
            fileRef
        );
        
        documentContext = await getContext(userMessage.content, fileRef);
        
        userMessage.content = `${userMessage.content}\n\nFile contents:\n${documentContext}`;
        userMessage.experimental_attachments = [];
      }
    }

    const recentMessages = filteredMessages.map((msg: Message) => {
      if (msg.id === userMessage.id) {
        return {
          ...msg,
          content: documentContext ? 
            `${msg.content}\n\nContext from attached files:\n${documentContext}` : 
            msg.content,
          experimental_attachments: userMessage.experimental_attachments
        };
      }
      return msg;
    }).slice(-5);

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(modelId),
          messages: convertToCoreMessages(recentMessages),
          maxSteps: 5,
          system: systemPrompt,
          tools: {
            execute_code: tool({
              description: "Execute code",
              parameters: z.object({
                code: z.string().describe("The code to execute"),
                language: z.enum(["python", "r", "julia"]).default("python").describe("Programming language to use")
              }),
              execute: async ({ code: codeToExecute }) => {
                const sandbox = await Sandbox.create(process.env.SANDBOX_TEMPLATE_ID!);

                try {
                  const execution = await sandbox.runCode(codeToExecute);
                  
                  if (execution.error) {
                    return `Error executing code:\n${execution.error.toString()}`;
                  }

                  const output = execution.results
                    .map(result => {
                      if ('stdout' in result) return result.stdout;
                      if ('stderr' in result) return `Error: ${result.stderr}`;
                      if ('error' in result) return `Error: ${(result.error as Error).toString()}`;
                      return '';
                    })
                    .filter(Boolean)
                    .join('\n');

                  return output || 'Code executed successfully with no output.';
                } catch (error) {
                  console.error('Error executing code:', error);
                  return `Error executing code:\n${error instanceof Error ? error.message : JSON.stringify(error)}`;
                }
              }
            }),

            visualization: tool({
              description: "Generate data visualizations using Python/R/Julia. Can create bar, line, scatter, pie, histogram, box, violin, bubble, heatmap, choropleth, treemap, funnel, waterfall, candlestick, and area charts.",
              parameters: z.object({
                code: z.string().optional().describe("The code to generate the visualization. If not provided, will generate code based on other parameters"),
                language: z.enum(["python", "r", "julia"]).default("python"),
                data: z.array(z.number()).describe("Array of numbers to chart"),
                type: z.enum(["bar", "line", "scatter", "pie", "histogram", "box", "violin", "bubble", "heatmap", "choropleth", "treemap", "funnel", "waterfall", "candlestick", "area"]).default("bar"),
                title: z.string().default("Chart")
              }),
              execute: async ({ code, language, data, title }) => {
                const sandbox = await createSandbox(language);
                
                const finalCode = code || `
import matplotlib.pyplot as plt
import numpy as np
import io
import base64

# Set up the data
data = ${JSON.stringify(data)}
data_matrix = np.array(data).reshape((int(np.sqrt(len(data))), -1))

# Create the heatmap
plt.figure(figsize=(10, 8))
plt.imshow(data_matrix, cmap='viridis')
plt.colorbar()
plt.title("${title}")

# Save the plot to a bytes buffer
buf = io.BytesIO()
plt.savefig(buf, format='png')
buf.seek(0)
img_str = base64.b64encode(buf.getvalue()).decode('utf-8')

# Clear the current figure
plt.close()

# Return the image data in the expected format
result = {
    'chart': {
        'type': 'heatmap',
        'title': "${title}",
        'image': f'data:image/png;base64,{img_str}'
    }
}
print(result)
`;

                const charts = await runVisualizationCode(sandbox, finalCode);
                return { charts };
              }
            }),
            reports: tool({
              description: 'Generate data analysis reports from CSV or Excel files using Python. Creates downloadable reports with statistical analysis, visualizations, and insights.',
              parameters: z.object({
                type: z.enum(['summary', 'detailed']),
                columns: z.array(z.string()).optional(),
                format: z.enum(['text', 'markdown', 'html']).default('markdown')
              }),
              execute: async ({ type, format }) => {
                const sandbox = await Sandbox.create(process.env.SANDBOX_TEMPLATE_ID!);
                try {
                  // if file exists, read in sandbox
                  if (fileRef) {
                    const content = fs.readFileSync(fileRef, 'utf-8');
                    await sandbox.files.write(fileRef, content);
                  }

                  // otherwise sample code to generate report
                  const analysisCode = `
                    import pandas as pd
                    import numpy as np
                    
                    # Read the data
                    df = pd.read_csv('${fileRef}' if '${fileRef}' else 'sample_data.csv')
                    
                    # Analysis based on type
                    analysis = []
                    
                    if '${type}' == 'summary':
                        # Basic statistics
                        analysis.append("# Summary Statistics\\n")
                        analysis.append(df.describe().to_string())
                        
                        # Missing values
                        analysis.append("\\n\\n# Missing Values\\n")
                        analysis.append(df.isnull().sum().to_string())
                        
                    else:  # detailed
                        # Detailed analysis
                        analysis.append("# Detailed Analysis Report\\n")
                        
                        # Basic statistics
                        analysis.append("## Summary Statistics\\n")
                        analysis.append(df.describe().to_string())
                        
                        # Missing values
                        analysis.append("\\n\\n## Missing Values\\n")
                        analysis.append(df.isnull().sum().to_string())
                        
                        # Correlation analysis
                        analysis.append("\\n\\n## Correlation Analysis\\n")
                        numeric_cols = df.select_dtypes(include=[np.number]).columns
                        analysis.append(df[numeric_cols].corr().to_string())
                        
                        # Column-specific analysis
                        analysis.append("\\n\\n## Column Analysis\\n")
                        for col in df.columns:
                            analysis.append(f"\\n### {col}\\n")
                            if df[col].dtype in ['int64', 'float64']:
                                analysis.append(f"Mean: {df[col].mean():.2f}")
                                analysis.append(f"\\nMedian: {df[col].median():.2f}")
                                analysis.append(f"\\nStd Dev: {df[col].std():.2f}")
                            else:
                                analysis.append(f"Unique Values: {df[col].nunique()}")
                                analysis.append("\\nTop 5 Values:\\n")
                                analysis.append(df[col].value_counts().head().to_string())
                    
                    # Save the report
                    report = "\\n".join(analysis)
                    with open('report.${format}', 'w') as f:
                        f.write(report)
                  `;

                  // code is executed in the sandbox
                  const execution = await sandbox.runCode(analysisCode);
                  
                  if (execution.error) {
                    throw new Error(`Analysis failed: ${JSON.stringify(execution.error)}`);
                  }

                  const output = execution.results
                    .map(result => {
                      if ('stdout' in result) return result.stdout;
                      if ('stderr' in result) return `Error: ${result.stderr}`;
                      return '';
                    })
                    .filter(Boolean)
                    .join('\n');

                  // Get the report file for download
                  const reportContent = await sandbox.files.read('report.' + format);
                  fs.writeFileSync('report.' + format, reportContent);
                  
                  return {
                    type: 'report',
                    content: {
                      text: output, // Show analysis output in chat
                      report: `report.${format}`, // File path for download
                      format: format
                    }
                  };
                } catch (error) {
                  console.error('Error generating report:', error);
                  throw new Error(`Failed to generate report: ${error instanceof Error ? error.message : String(error)}`);
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