import { getSession } from '@/db/cached-queries';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const user = await getSession();

  if (!user) {
    return Response.json('Unauthorized!', { status: 401 });
  }

  const { data: chats, error } = await supabase
    .from('chats')
    .select()
    .eq('user_id', user.id!)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return Response.json(chats);
}
