import {
  CoreAssistantMessage,
  CoreToolMessage,
  Message,
  ToolInvocation,
  ToolContent,
} from 'ai';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Database } from './supabase/types';

type DBMessage = Database['public']['Tables']['messages']['Row'];
type Document = Database['public']['Tables']['documents']['Row'];

type MetadataProps = {
  title?: string;
  description?: string;
  canonical: string;
}

const defaultMetadata = {
  title: "ArenasAI - Your AI Data Scientist.",
  description: "ArenasAI is an Open Source AI Data Scientist that streamlines big data operations with ease, and replaces excel forever."
};

export const constructMetadata = ({
  title,
  description= defaultMetadata.description,
  canonical = "/",
}: MetadataProps) => {
  return {
  metadataBase: new URL('https://arenas.chat/'),
  title: title ? `${title} - ArenasAI` : defaultMetadata.title,
  description,
  keywords: [
    "ai",
    "data analysis",
    "data science",
    "ai data analysis tool",
    "ArenasAI",
  ],
  alternates: {
    canonical,
  },
  authors: [
    {
      name: "Mubashir Osmani",
      url: "https://github.com/mubashir1osmani",
    }
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: "canonical",
    // images: [ gotta ADD IMAGES!!!!!!!!!!!!!!!!!!!!!!!!!!!

    // ]
  }
  }
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function parseToolContent(content: string): ToolContent {
  try {
    const parsed = JSON.parse(content);
    return parsed.map((item: { 
      type?: string;
      toolCallId: string;
      toolName: string;
      result: unknown;
    }) => ({
      type: item.type || 'tool-result',
      toolCallId: item.toolCallId,
      toolName: item.toolName,
      result: item.result,
    }));
  } catch (e) {
    console.error('Failed to parse tool content:', e);
    return [];
  }
}

function addToolMessageToChat({
  toolMessage,
  messages,
}: {
  toolMessage: DBMessage;
  messages: Array<Message>;
}): Array<Message> {
  return messages.map((message) => {
    if (message.toolInvocations) {
      const toolContent = parseToolContent(
        toolMessage.content?.toString() ?? ''
      );

      return {
        ...message,
        toolInvocations: message.toolInvocations.map((toolInvocation) => {
          const toolResult = toolContent.find(
            (tool) => tool.toolCallId === toolInvocation.toolCallId
          );

          if (toolResult) {
            return {
              ...toolInvocation,
              state: 'result',
              result: toolResult.result,
            };
          }

          return toolInvocation;
        }),
      };
    }

    return message;
  });
}

export async function fetcher<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  return response.json();
}

// Add type for message annotations
interface MessageAnnotation {
  messageIdFromServer?: string;
}

// Update getMessageIdFromAnnotations to use proper typing
export function getMessageIdFromAnnotations(message: Message) {
  if (!message.annotations) return message.id;

  const annotations = message.annotations as MessageAnnotation[];
  const [annotation] = annotations;

  if (!annotation?.messageIdFromServer) return message.id;

  return annotation.messageIdFromServer;
}

export const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ??
    process?.env?.NEXT_PUBLIC_APP_URL ??
    process?.env?.NEXT_PUBLIC_VERCEL_URL ??
    "http://localhost:3000";

  // Include `https://` when not localhost.
  url = url.startsWith("http") ? url : `https://${url}`;
  // Remove trailing slash if present
  url = url.endsWith("/") ? url.slice(0, -1) : url;
  return url;
};

export function convertToUIMessages(
  messages: Array<DBMessage>
): Array<Message> {
  return messages.reduce((chatMessages: Array<Message>, message) => {
    if (message.role === 'tool') {
      return addToolMessageToChat({
        toolMessage: message,
        messages: chatMessages,
      });
    }

    let textContent = '';
    const toolInvocations: Array<ToolInvocation> = [];

    try {
      const parsedContent = JSON.parse(message.content?.toString() ?? '');

      if (Array.isArray(parsedContent)) {
        for (const content of parsedContent) {
          if (content.type === 'text') {
            textContent += content.text;
          } else if (content.type === 'tool-call') {
            toolInvocations.push({
              state: 'call',
              toolCallId: content.toolCallId,
              toolName: content.toolName,
              args: content.args,
            });
          }
        }
      } else {
        textContent = message.content?.toString() ?? '';
      }
    } catch {
      // If parsing fails, treat as plain text
      textContent = message.content?.toString() ?? '';
    }

    chatMessages.push({
      id: message.id,
      role: message.role as Message['role'],
      content: textContent,
      toolInvocations: toolInvocations.length > 0 ? toolInvocations : undefined,
    });

    return chatMessages;
  }, []);
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { 
  id: string;
  experimental_attachments?: Array<{
    url: string;
    type: string;
    name: string;
  }>;
};

type MessageContent = {
  type: string;
  text?: string;
  toolCallId?: string;
  reasoning?: string;
}

export function sanitizeResponseMessages({
  messages,
  reasoning,
}: {
  messages: Array<ResponseMessage>;
  reasoning: string | undefined;
}) {
  const toolResultIds: Array<string> = [];

  for (const message of messages) {
    if (message.role === 'tool') {
      for (const content of message.content) {
        if (content.type === 'tool-result') {
          toolResultIds.push(content.toolCallId);
        }
      }
    }
  }

  const messagesBySanitizedContent = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (typeof message.content === 'string') return message;

    const sanitizedContent = message.content.filter((content: MessageContent) =>
      content.type === 'tool-call'
        ? toolResultIds.includes(content.toolCallId!)
        : content.type === 'text'
          ? content.text!.length > 0
          : true,
    );

    if (reasoning) {
      sanitizedContent.push({ type: 'text', text: reasoning });
    }

    if (message.experimental_attachments) {
      return {
        ...message,
        content: sanitizedContent,
        experimental_attachments: message.experimental_attachments,
      };
    }

    return {
      ...message,
      content: sanitizedContent,
    };
  });

  return messagesBySanitizedContent.filter(
    (message) => message.content.length > 0,
  );
}

export function sanitizeUIMessages(messages: Array<Message>): Array<Message> {
  const messagesBySanitizedToolInvocations = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (!message.toolInvocations) return message;

    const toolResultIds: Array<string> = [];

    for (const toolInvocation of message.toolInvocations) {
      if (toolInvocation.state === 'result') {
        toolResultIds.push(toolInvocation.toolCallId);
      }
    }

    const sanitizedToolInvocations = message.toolInvocations.filter(
      (toolInvocation) =>
        toolInvocation.state === 'result' ||
        toolResultIds.includes(toolInvocation.toolCallId),
    );

    return {
      ...message,
      toolInvocations: sanitizedToolInvocations,
    };
  });

  return messagesBySanitizedToolInvocations.filter(
    (message) =>
      message.content.length > 0 ||
      (message.toolInvocations && message.toolInvocations.length > 0),
  );
}


export function getMostRecentUserMessage(messages: Array<Message>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}


export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].created_at;
}

/**
 * Extracts a document ID from a message string
 * Format expected: "document:123456"
 */
export function extractDocumentId(message: string): string | null {
  const match = message.match(/document:([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export const actionGroups = [
  {
    id: 'excel' as const,
    name: 'Excel Realtime',
    description: 'Use Excel to create realtime reports',
    icon: 'excel',
    color: 'blue',
    show: true,
  },

] as const;

export type ActionGroups = (typeof actionGroups)[number];

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export function extractCode(message: string): string | null {
  const match = message.match(/```python([\s\S]*?)```/);
  return match ? match[1] : null;
}