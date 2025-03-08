'use server';

import { generateText, Message } from 'ai';
import { cookies } from 'next/headers';
import { myProvider } from '@/ai/models';
import createClient from '@/lib/supabase/server';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
} from '@/lib/cached/queries';

export async function saveModelId(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('model-id', model);
}

export async function generateTitleFromUserMessage({
  message,
  selectedModelId,
}: {
  message: Message;
  selectedModelId: string;
}) {
  try {
  const { text: title } = await generateText({
    model: myProvider.languageModel('gpt-4o'),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });
  return title;
} catch (error) {
  console.error('Error generating title:', error);
  return 'Error generating title';
}
}
