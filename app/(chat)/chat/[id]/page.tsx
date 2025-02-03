import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { DEFAULT_MODEL_NAME, models } from '@/ai/models';
import { Chat as PreviewChat } from '@/components/custom/chat';
import { convertToUIMessages } from '@/lib/utils';
import createClient from '@/lib/supabase/server';

const chat_cache = {
  getChatById: async (id: string, token: string) => {
    const response = await fetch(`${process.env.ARENAS_SERVER}/chat/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    if (!response.ok) return null;
    return response.json();
  },

  getMessagesByChatId: async (chatId: string, token: string) => {
    const response = await fetch(
      `${process.env.ARENAS_SERVER}/chat/${chatId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      }
    );
    if (!response.ok) return [];
    return response.json();
  },
};

export default async function Page(props: { params: Promise<any> }) {
  const params = await props.params;
  const { id } = params;
  const cookieStore = await cookies();
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    notFound();
  }

  const [chat, messages] = await Promise.all([
    chat_cache.getChatById(id, user.id),
    chat_cache.getMessagesByChatId(id, user.id)
  ]);

  if (!chat) {
    notFound();
  }

  if (user.id !== chat.user_id) {
    notFound();
  }

  // Get model selection
  const modelIdFromCookie = cookieStore.get('model-id')?.value;
  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <PreviewChat
      id={chat.id}
      initialMessages={convertToUIMessages(messages)}
      selectedModelId={selectedModelId}
    />
  );
}