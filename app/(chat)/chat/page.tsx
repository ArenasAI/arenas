import { cookies } from 'next/headers';
import { Metadata } from 'next';
import { constructMetadata } from '@/lib/utils';
import { DEFAULT_MODEL_NAME, models } from '@/ai/models';
import { Chat } from '@/components/custom/chat';
import { generateUUID } from '@/lib/utils';

export const metadata: Metadata = constructMetadata({
  title: 'Chat',
  description: 'start analyzing your data.',
  canonical: '/chat',
});

export default async function ChatPage() {
  const cookieStore = await cookies()

  const id = generateUUID();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;

  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <div className="flex-1 overflow-hidden">
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        selectedModelId={selectedModelId}
      />
    </div>
  );
}
