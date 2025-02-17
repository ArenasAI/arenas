import {
  convertToCoreMessages,
  CoreMessage,
  createDataStreamResponse,
  type Message,
  smoothStream,
  streamText,
} from 'ai';
import { z } from 'zod';
import { myProvider } from '@/ai/models';
import { models } from '@/ai/models';
import { systemPrompt } from '@/ai/prompts';
import { getChatById, getDocumentById, getSession } from '@/lib/cached/cached-queries';
import {
  saveChat,
  saveDocument,
  saveMessages,
  saveSuggestions,
  deleteChatById,
} from '@/lib/cached/mutations';
import createClient from '@/lib/supabase/server';
import { MessageRole } from '@/lib/supabase/types';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/cached/cached-queries';

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
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const response = await fetch(`${process.env.ARENAS_SERVER}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        messages,
        modelId,
        userId: session.user_metadata.user.id,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch response from the server');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching response from the API:', error);
    return NextResponse.json({ error: 'Failed to fetch response' }, { status: 500 });
  }
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
    console.log(`Attempting to delete chat with ID: ${id}`);

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