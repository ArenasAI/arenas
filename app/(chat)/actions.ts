'use server';

import { CoreUserMessage, generateText } from 'ai';
import { cookies } from 'next/headers';
import { customModel } from '@/ai/models';
import createClient from '@/lib/supabase/server';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from '@/lib/cached/queries';
import { VisibilityType } from '@/components/visibility-selector';

export async function saveModelId(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('model-id', model);
}

export async function generateTitleFromUserMessage({
  message,
  selectedModelId,
}: {
  message: CoreUserMessage;
  selectedModelId: string;
}) {
  try {
  const { text: title } = await generateText({
    model: customModel('gpt-4o'),
    system: `\n
    generate a short summary of user's query which should not be more than 80 characters long
    do not use quotes or colons.`,
    prompt: JSON.stringify(message),
  });
  return title;
} catch (error) {
  console.error('Error generating title:', error);
  return 'Error generating title';
}
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const supabase = await createClient()
  const [message] = await getMessageById(supabase, { id });

  await deleteMessagesByChatIdAfterTimestamp( supabase, {
    chatId: message.chat_id,
    timestamp: message.created_at,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  const supabase = await createClient();
  await updateChatVisiblityById(supabase, {chatId, visibility});
}