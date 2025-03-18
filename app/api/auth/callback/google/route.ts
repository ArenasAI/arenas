import { oauth2Client, saveCredentials } from '@/services/google-sheets';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    await saveCredentials(tokens);
    
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Error getting tokens:', error);
    return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 });
  }
} 