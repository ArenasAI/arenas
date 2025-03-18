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
}: {
  message: Message;
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

export async function upgradeSubscription(priceId: string, plan: string) {
  const response = await fetch('/api/upgrade-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ priceId, plan }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upgrade subscription');
  }

  return response.json();
}