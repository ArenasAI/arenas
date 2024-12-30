import { revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  handleDatabaseError,
  PostgrestError,
  type Client,
  type Message,
} from '@/lib/supabase/types';

const getSupabase = async () => createClient();

async function mutateQuery<T extends any[]>(
  queryFn: (client: Client, ...args: T) => Promise<void>,
  args: T,
  tags: string[]
) {
  const supabase = await getSupabase();
  try {
    await queryFn(supabase, ...args);
    tags.forEach((tag) => revalidateTag(tag));
  } catch (error) {
    handleDatabaseError(error as PostgrestError);
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  await mutateQuery(
    async (client, { id, userId, title }) => {
      const now = new Date().toISOString();
      const { error } = await client.from('chats').insert({
        id,
        user_id: userId,
        title,
        created_at: now,
        updated_at: now,
      });
      if (error) throw error;
    },
    [{ id, userId, title }],
    [`user_${userId}_chats`, `chat_${id}`, 'chats']
  );
}

export async function deleteChatById(chatId: string, userId: string) {
  await mutateQuery(
    async (client, id) => {
      // Messages will be automatically deleted due to CASCADE
      const { error } = await client.from('chats').delete().eq('id', id);
      if (error) throw error;
    },
    [chatId],
    [
      `chat_${chatId}`, // Invalidate specific chat
      `user_${userId}_chats`, // Invalidate user's chat list
      `chat_${chatId}_messages`, // Invalidate chat messages
      `chat_${chatId}_votes`, // Invalidate chat votes
      'chats', // Invalidate all chats cache
    ]
  );
}

export async function saveMessages({
  chatId,
  messages,
}: {
  chatId: string;
  messages: Message[];
}) {
  await mutateQuery(
    async (client, { chatId, messages }) => {
      const formattedMessages = messages.map((message) => {
        // Handle tool invocations and content
        let content = message.content;

        // If message has tool invocations, save them as part of the content
        if (message?.toolInvocations && message?.toolInvocations?.length > 0) {
          content = JSON.stringify({
            content: message.content,
            toolInvocations: message.toolInvocations,
          });
        } else if (typeof content === 'object') {
          content = JSON.stringify(content);
        }

        // Handle annotations if present
        if (message.annotations && message.annotations?.length > 0) {
          content = JSON.stringify({
            content: content,
            annotations: message.annotations,
          });
        }

        return {
          id: message.id,
          chat_id: chatId,
          role: message.role,
          content: content,
          created_at: message.created_at || new Date().toISOString(),
        };
      });

      const { error } = await client.from('messages').insert(formattedMessages);
      if (error) throw error;
    },
    [{ chatId, messages }],
    [`chat_${chatId}_messages`, `chat_${chatId}`]
  );
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  await mutateQuery(
    async (client, { chatId, messageId, type }) => {
      // First verify the message exists
      const { data: message, error: messageError } = await client
        .from('messages')
        .select('id')
        .eq('id', messageId)
        .single();

      if (messageError || !message) {
        console.error(
          'Message not found:',
          messageError || 'No message with this ID'
        );
        throw new Error('Message not found');
      }

      const { error: updateError } = await client.from('votes').upsert(
        {
          chat_id: chatId,
          message_id: messageId,
          is_upvoted: type === 'up',
        },
        {
          onConflict: 'chat_id,message_id',
        }
      );

      if (updateError) {
        console.error('Vote error:', updateError);
        throw updateError;
      }
    },
    [{ chatId, messageId, type }],
    [`chat_${chatId}_votes`, `chat_${chatId}`]
  );
}

export async function saveDocument({
  id,
  title,
  content,
  userId,
}: {
  id: string;
  title: string;
  content?: string;
  userId: string;
}) {
  await mutateQuery(
    async (client, { id, title, content, userId }) => {
      // First check if document exists and user has access
      const { data: existingDoc, error: checkError } = await client
        .from('documents')
        .select('created_at')
        .eq('id', id)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // Generate a new timestamp that's guaranteed to be later than the existing one
      const timestamp = existingDoc?.[0]
        ? new Date(
            new Date(existingDoc[0].created_at).getTime() + 1000
          ).toISOString()
        : new Date().toISOString();

      // Try to insert with retry logic
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        const { error } = await client.from('documents').insert({
          id,
          title,
          content,
          user_id: userId,
          created_at: timestamp,
        });

        if (!error) {
          return; // Success
        }

        if (error.code === '23505') {
          // Version conflict, retry with a new timestamp
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, 100 * retryCount)
            ); // Exponential backoff
            continue;
          }
        }

        // Other errors or max retries reached
        if (error.code === '42501') {
          console.error('RLS error:', error);
          throw new Error('Unauthorized to create document');
        }
        throw error;
      }

      throw new Error('Failed to save document after multiple attempts');
    },
    [{ id, title, content, userId }],
    [`document_${id}`, `document_${id}_versions`, 'documents']
  );
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<{
    documentId: string;
    documentCreatedAt: string;
    originalText: string;
    suggestedText: string;
    description: string;
    userId: string;
    isResolved: boolean;
  }>;
}) {
  await mutateQuery(
    async (client, suggestions) => {
      const { error } = await client.from('suggestions').insert(
        suggestions.map((s) => ({
          document_id: s.documentId,
          document_created_at: s.documentCreatedAt,
          original_text: s.originalText,
          suggested_text: s.suggestedText,
          description: s.description,
          user_id: s.userId,
          is_resolved: s.isResolved,
        }))
      );
      if (error) throw error;
    },
    [suggestions],
    suggestions
      .map((s) => [
        `document_${s.documentId}_suggestions`,
        `document_${s.documentId}`,
      ])
      .flat()
  );
}

export async function saveSuggestions1({
  documentId,
  documentCreatedAt,
  originalText,
  suggestedText,
  description,
  userId,
}: {
  documentId: string;
  documentCreatedAt: string;
  originalText: string;
  suggestedText: string;
  description?: string;
  userId: string;
}) {
  await mutateQuery(
    async (client, args) => {
      const { error } = await client.from('suggestions').insert({
        document_id: args.documentId,
        document_created_at: args.documentCreatedAt,
        original_text: args.originalText,
        suggested_text: args.suggestedText,
        description: args.description,
        user_id: args.userId,
      });
      if (error) throw error;
    },
    [
      {
        documentId,
        documentCreatedAt,
        originalText,
        suggestedText,
        description,
        userId,
      },
    ],
    [`document_${documentId}_suggestions`, `document_${documentId}`]
  );
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: string;
}) {
  await mutateQuery(
    async (client, { id, timestamp }) => {
      const { error } = await client
        .from('documents')
        .delete()
        .eq('id', id)
        .gte('created_at', timestamp);
      if (error) throw error;
    },
    [{ id, timestamp }],
    [
      `document_${id}`, // Invalidate specific document
      `document_${id}_versions`, // Invalidate document versions
      'documents', // Invalidate all documents cache
    ]
  );
}
