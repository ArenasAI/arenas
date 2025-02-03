'use server';

import { CoreUserMessage, generateText } from 'ai';
import { cookies } from 'next/headers';
import { customModel } from '@/ai';


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
    generate a short summary of user's query which should not be more than 80 characters long
    do not use quotes or colons.`,
    prompt: JSON.stringify(message),
  });

  return title;
}