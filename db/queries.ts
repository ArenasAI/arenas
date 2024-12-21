import { AuthError } from '@supabase/supabase-js';
import type { Client, Database } from '../lib/supabase/types';

type Tables = Database['public']['Tables'];

export async function getSessionQuery(client: Client) {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) {
    throw {
      message: error.message,
      status: error.status || 500,
    } as AuthError;
  }

  return user;
}

export async function getUserByIdQuery(client: Client, id: string) {
  const { data: user, error } = await client
    .from('users')
    .select()
    .eq('id', id)
    .single();

  if (error) {
    throw {
      message: error.message,
      status: error?.code ? 400 : 500,
    } as AuthError;
  }

  return user;
}

export async function getUserQuery(client: Client, email: string) {
  const { data: users, error } = await client
    .from('users')
    .select()
    .eq('email', email)
    .single();

  if (error) throw error;
  return users;
}

export async function saveChatQuery(
  client: Client,
  {
    id,
    userId,
    title,
  }: {
    id: string;
    userId: string;
    title: string;
  }
) {
  const { error } = await client.from('chats').insert({
    id,
    user_id: userId,
    title,
  });

  if (error) throw error;
}

export async function getChatsByUserIdQuery(
  client: Client,
  { id }: { id: string }
) {
  const { data: chats, error } = await client
    .from('chats')
    .select()
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return chats;
}

export async function getChatByIdQuery(client: Client, { id }: { id: string }) {
  const { data: chat, error } = await client
    .from('chats')
    .select()
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  return chat;
}

export async function getMessagesByChatIdQuery(
  client: Client,
  { id }: { id: string }
) {
  const { data: messages, error } = await client
    .from('messages')
    .select()
    .eq('chat_id', id)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return messages;
}

export async function saveMessagesQuery(
  client: Client,
  {
    chatId,
    messages,
  }: {
    chatId: string;
    messages: Tables['messages']['Insert'][];
  }
) {
  const messagesWithChatId = messages.map((message) => ({
    ...message,
    chat_id: chatId,
  }));

  const { error } = await client.from('messages').insert(messagesWithChatId);

  if (error) throw error;
}

export async function voteMessageQuery(
  client: Client,
  {
    chatId,
    messageId,
    isUpvoted,
  }: {
    chatId: string;
    messageId: string;
    isUpvoted: boolean;
  }
) {
  const { data: message, error: messageError } = await client
    .from('messages')
    .select('id')
    .eq('id', messageId)
    .eq('chat_id', chatId)
    .single();

  if (messageError || !message) {
    throw new Error('Message not found or does not belong to this chat');
  }

  const { error } = await client.from('votes').upsert(
    {
      chat_id: chatId,
      message_id: messageId,
      is_upvoted: isUpvoted,
    },
    {
      onConflict: 'chat_id,message_id',
    }
  );

  if (error) throw error;
}

export async function getVotesByChatIdQuery(
  client: Client,
  { id }: { id: string }
) {
  const { data: votes, error } = await client
    .from('votes')
    .select()
    .eq('chat_id', id);

  if (error) throw error;
  return votes;
}

export async function getDocumentByIdQuery(
  client: Client,
  { id }: { id: string }
): Promise<Tables['documents']['Row'] | null> {
  const { data: documents, error } = await client
    .from('documents')
    .select()
    .eq('id', id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  return documents?.[0] || null;
}

export async function saveDocumentQuery(
  client: Client,
  {
    id,
    title,
    content,
    userId,
  }: {
    id: string;
    title: string;
    content?: string;
    userId: string;
  }
) {
  const { error } = await client.from('documents').insert({
    id,
    title,
    content,
    user_id: userId,
  });

  if (error) throw error;
}

export async function getSuggestionsByDocumentIdQuery(
  client: Client,
  { documentId }: { documentId: string }
) {
  const { data: suggestions, error } = await client
    .from('suggestions')
    .select()
    .eq('document_id', documentId);

  if (error) throw error;
  return suggestions;
}

export async function saveSuggestionsQuery(
  client: Client,
  {
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
  }
) {
  const { error } = await client.from('suggestions').insert({
    document_id: documentId,
    document_created_at: documentCreatedAt,
    original_text: originalText,
    suggested_text: suggestedText,
    description,
    user_id: userId,
  });

  if (error) throw error;
}

export async function deleteDocumentsByIdAfterTimestampQuery(
  client: Client,
  { id, timestamp }: { id: string; timestamp: string }
) {
  const { error } = await client
    .from('documents')
    .delete()
    .eq('id', id)
    .gte('created_at', timestamp);

  if (error) throw error;
}

export async function getDocumentsByIdQuery(
  client: Client,
  { id }: { id: string }
) {
  const { data: documents, error } = await client
    .from('documents')
    .select()
    .eq('id', id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return documents;
}

export async function getChatWithMessagesQuery(
  client: Client,
  { id }: { id: string }
) {
  const { data: chat, error: chatError } = await client
    .from('chats')
    .select()
    .eq('id', id)
    .single();

  if (chatError) {
    if (chatError.code === 'PGRST116') {
      return null;
    }
    throw chatError;
  }

  const { data: messages, error: messagesError } = await client
    .from('messages')
    .select()
    .eq('chat_id', id)
    .order('created_at', { ascending: true });

  if (messagesError) throw messagesError;

  return {
    ...chat,
    messages: messages || [],
  };
}

type PostgrestError = {
  code: string;
  message: string;
  details: string | null;
  hint: string | null;
};

export function handleSupabaseError(error: PostgrestError | null) {
  if (!error) return null;

  if (error.code === 'PGRST116') {
    return null;
  }

  throw error;
}
