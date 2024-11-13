import { getAIResponse } from '@/lib/add-llm';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { prompt, model } = body;
        
        if (!prompt) {
            return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
            );
    }

    const response = await getAIResponse(prompt, model);
    return NextResponse.json({
      response: response.content,
      source: response.source
    });
    
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error.message,
        fallback: true
      },
      { status: 500 }
    );
  }
}