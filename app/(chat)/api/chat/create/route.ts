// app/(chat)/api/chat/create/route.ts
import { NextResponse } from 'next/server';
import { createAndSaveChat } from '@/shared/chat';

export async function POST(req: Request) {
  try {
    const { userId, title } = await req.json();
    
    if (!userId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newChatId = await createAndSaveChat(userId, title);
    return NextResponse.json({ newChatId });
    
  } catch (error) {
    console.error('Chat creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}