// import { CookieOptions, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { constructMetadata } from '@/lib/utils';
import { DEFAULT_MODEL_NAME, models } from '@/ai/models';
import { Chat } from '@/components/custom/chat';
import { generateUUID } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = constructMetadata({
  title: 'Chat',
  description: 'start analyzing your data.',
  canonical: '/chat',
});

export default async function ChatPage() {
  const cookieStore = await cookies()
  const supabase = await createClient()
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Get initial chat data
  const { data: initialChats } = await supabase
    .from('chats')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

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
        initialChats={initialChats}
        selectedModelId={selectedModelId}
      />
    </div>
  );
}
