import { NextResponse } from 'next/server';
import createClient from '@/lib/supabase/server';

export async function DELETE(req: Request) {
  try {
    const { chatId, path, url } = await req.json();
    
    if (!chatId || !path) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { error: storageError } = await supabase.storage
      .from('chat_attachments')
      .remove([`${user.id}/${chatId}/${path}`]);

    if (storageError) {
      console.error('Storage removal error:', storageError);
      throw storageError;
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('file_uploads')
      .delete()
      .match({
        user_id: user.id,
        chat_id: chatId,
        storage_path: `${user.id}/${chatId}/${path}`
      });

    if (dbError) {
      console.error('Database removal error:', dbError);
      throw dbError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('File removal error:', error);
    return NextResponse.json(
      { error: 'Failed to remove file' },
      { status: 500 }
    );
  }
}
