// app/chat/[id]/page.tsx
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { DEFAULT_MODEL_NAME, models } from '@/ai/models';
import { Chat as PreviewChat } from '@/components/custom/chat';
import {
  getChatById,
  getMessagesByChatId,
  getSession,
} from '@/db/cached-queries';
import { convertToUIMessages } from '@/lib/utils';

export default async function ChatPage({ params }: { params: { id: string } }) {
  try {
    const chat = await getChatById(params.id);
  if (!chat) {
    notFound();
  }

  const user = await getSession();
    if (!user || user.id !== chat.user_id) {
      notFound();
  }

    const messagesFromDb = await getMessagesByChatId(params.id);

    const cookieStore = cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;
  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
      <div className="flex-1 overflow-hidden">
    <PreviewChat
      id={chat.id}
      initialMessages={convertToUIMessages(messagesFromDb)}
      selectedModelId={selectedModelId}
    />
      </div>
  );
  } catch (error) {
    console.error(error)
    notFound();
}
}