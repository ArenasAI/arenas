'use server';

import { CoreUserMessage, generateText } from 'ai';
import { cookies } from 'next/headers';
import { CookieOptions, createServerClient } from '@supabase/ssr';
import type { Chat, ChatMessage } from '@/lib/supabase/types';
import { customModel } from '@/ai';

// Utility function to create Supabase client
async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set(name, '', options);
        },
      },
    }
  );
}

export async function saveModelId(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('model-id', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: CoreUserMessage;
}) {
  const { text: title } = await generateText({
    model: customModel('gpt-4o-mini'),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function createChat(chat: Partial<Chat>) {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('chats')
    .insert([{
      id: chat.id,
      user_id: session.user.id,
      title: chat.title || 'New Chat',
      messages: []
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getChatById(chatId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateChatMessages(chatId: string, messages: ChatMessage[]) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('chats')
    .update({ messages })
    .eq('id', chatId)
    .select()
    .single();

  if (error) throw error;
  return data;
}