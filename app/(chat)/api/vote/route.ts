import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { voteMessage } from '@/db/mutations';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    const { chatId, messageId, type } = await request.json();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await voteMessage({ chatId, messageId, type });

    return NextResponse.json({ message: 'Vote recorded' });
  } catch (error) {
    console.error('Vote recording error:', error);
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: votes, error } = await supabase
      .from('votes')
      .select('*')
      .eq('chat_id', chatId);

    if (error) throw error;
    return NextResponse.json(votes);
  } catch (error) {
    console.error('Vote fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch votes' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    const { chatId, messageId, type }: { chatId: string; messageId: string; type: 'up' | 'down' } = 
      await request.json();

    if (!chatId || !messageId || !type) {
      return NextResponse.json(
        { error: 'messageId and type are required' },
        { status: 400 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await voteMessage({
      chatId,
      messageId,
      type: type,
    });

    return NextResponse.json({ message: 'Message voted' });
  } catch (error) {
    console.error('Vote update error:', error);

    if (error instanceof Error && error.message === 'Message not found') {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update vote' },
      { status: 500 }
    );
  }
}
