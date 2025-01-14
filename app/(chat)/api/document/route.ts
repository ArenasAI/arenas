import { NextResponse } from 'next/server';

import { saveDocument } from '@/db/mutations';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const { id } = Object.fromEntries(new URL(req.url).searchParams);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: document, error } = await supabase.rpc(
      'get_latest_document',
      {
        doc_id: id,
        auth_user_id: user.id,
      }
    );

    if (error) throw error;

    const { data: versions, error: versionsError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (versionsError) throw versionsError;

    return NextResponse.json(versions);
  } catch (error: any) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { id } = Object.fromEntries(new URL(req.url).searchParams);
    const { content, title } = await req.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if document exists first
    const { data: existingDoc } = await supabase
      .from('documents')
      .select('id')
      .eq('id', id)
      .single();

    if (existingDoc) {
      // If document exists, do an update instead of insert
      const { error } = await supabase
        .from('documents')
        .update({
          content,
          title,
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } else {
      // If document doesn't exist, do an insert
      await saveDocument({
        id,
        content,
        title,
        userId: user.id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving document:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { content, title }: { content: string; title: string } =
      await request.json();

    const { error } = await supabase
      .from('documents')
      .update({ content, title })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating document:', error);
    return new Response('Error updating document', { status: 500 });
  }
}
